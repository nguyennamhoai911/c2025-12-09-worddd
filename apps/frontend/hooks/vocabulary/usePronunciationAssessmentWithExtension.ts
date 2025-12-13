// Hook mới: usePronunciationAssessmentWithExtension.ts
// Dùng cho iframe mode - gọi extension để record thay vì dùng trực tiếp getUserMedia

import { useState, useEffect, useRef } from "react";
import axios from "axios";

export interface AssessmentResult {
  AccuracyScore: number;
  Words: Array<{
    Word: string;
    AccuracyScore: number;
    Phonemes?: Array<{
      Phoneme: string;
      AccuracyScore: number;
    }>;
  }>;
}

// Detect if running in iframe
const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

const usePronunciationAssessmentWithExtension = (token: string | null) => {
  const [isRecording, setIsRecording] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [assessmentError, setAssessmentError] = useState("");
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);
  
  const currentWordRef = useRef<string>("");

  useEffect(() => {
    if (!isInIframe) return;

    // Listen for messages from extension
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      const { type, audioData, mimeType, error } = event.data;

      if (type === 'RECORDING_STARTED') {
        setIsRecording(true);
      }

      if (type === 'RECORDING_COMPLETE') {
        setIsRecording(false);
        
        // Convert base64 to blob
        const byteCharacters = atob(audioData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        
        // Create audio URL for playback
        const url = URL.createObjectURL(blob);
        setUserAudioUrl(url);
        
        // Send to backend for assessment
        sendAudioForAssessment(blob, currentWordRef.current);
      }

      if (type === 'RECORDING_ERROR') {
        setIsRecording(false);
        setAssessmentError(error || "Microphone access denied");
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const startRecording = (word: string) => {
    currentWordRef.current = word;
    setAssessmentResult(null);
    setAssessmentError("");
    setUserAudioUrl(null);

    if (isInIframe) {
      // Request extension to start recording
      window.parent.postMessage({ type: 'START_RECORDING' }, '*');
    } else {
      // Fallback to direct recording (when not in iframe)
      startDirectRecording(word);
    }
  };

  const stopRecording = () => {
    if (isInIframe) {
      // Request extension to stop recording
      window.parent.postMessage({ type: 'STOP_RECORDING' }, '*');
    } else {
      // Fallback to direct recording
      stopDirectRecording();
    }
  };

  // Fallback direct recording for non-iframe mode
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];

  const startDirectRecording = async (word: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks = [];
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setUserAudioUrl(url);
        await sendAudioForAssessment(audioBlob, word);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone error:", error);
      setAssessmentError("Cannot access microphone");
    }
  };

  const stopDirectRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const sendAudioForAssessment = async (audioBlob: Blob, word: string) => {
    if (!token || !word) return;

    setIsProcessingAudio(true);
    setAssessmentError("");

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("referenceText", word);

      const response = await axios.post(
        "https://localhost:5001/vocabulary/pronunciation-assessment",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setAssessmentResult(response.data);
    } catch (error: any) {
      console.error("Assessment error:", error);
      setAssessmentError(
        error.response?.data?.message || "Assessment failed"
      );
    } finally {
      setIsProcessingAudio(false);
    }
  };

  return {
    isRecording,
    assessmentResult,
    assessmentError,
    isProcessingAudio,
    userAudioUrl,
    startRecording,
    stopRecording,
  };
};

export default usePronunciationAssessmentWithExtension;