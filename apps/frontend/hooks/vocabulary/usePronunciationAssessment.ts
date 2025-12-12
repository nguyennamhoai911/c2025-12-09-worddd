
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { VocabItem } from "./useVocabData";
import { VocabFormData } from "./useVocabModals";

// --- INTERFACES ---
export interface AssessmentResult {
  AccuracyScore: number;
  FluencyScore?: number;
  CompletenessScore?: number;
  PronScore?: number;
  Words: Array<{
    Word: string;
    AccuracyScore: number;
    ErrorType: string;
    Phonemes: Array<{
      Phoneme: string;
      AccuracyScore: number;
    }>;
  }>;
}

// --- HELPERS ---
async function convertAudioToWav(audioBlob: Blob): Promise<Blob> {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)({
      sampleRate: 16000,
    });
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const pcmData = audioBuffer.getChannelData(0);
    const wavBuffer = encodeWAV(pcmData, 16000);
    return new Blob([wavBuffer], { type: "audio/wav" });
  }
  
function encodeWAV(samples: Float32Array, sampleRate: number) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, "data");
    view.setUint32(40, samples.length * 2, true);
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return view;
}


const usePronunciationAssessment = (
  token: string | null,
  fetchVocabs: (page?: number) => void,
  page: number
) => {
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [recordingVocabItem, setRecordingVocabItem] =
    useState<VocabItem | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [assessmentResult, setAssessmentResult] =
    useState<AssessmentResult | null>(null);
  const [assessmentError, setAssessmentError] = useState<string>("");
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);

  const handleOpenAssessment = (
    item: VocabItem | VocabFormData,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    const vocabItem =
      "id" in item
        ? item
        : ({
            ...item,
            id: "temp",
            occurrence: 0,
            isStarred: false,
            pronunciationScores: [],
            createdAt: "",
            updatedAt: "",
          } as VocabItem);

    setRecordingVocabItem(vocabItem);
    setAssessmentResult(null);
    setAssessmentError("");
    setUserAudioUrl(null);
    setIsAssessmentModalOpen(true);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setUserAudioUrl(audioUrl);
        await processAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setAssessmentError("");
    } catch (err) {
      setAssessmentError("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAssessmentModalOpen) {
      timer = setTimeout(() => {
        if (!isRecording) {
          startRecording();
        }
      }, 300);
    } else {
      stopRecording();
    }
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAssessmentModalOpen]);

  const processAudio = async (audioBlob: Blob) => {
    if (!recordingVocabItem) return;
    setIsProcessingAudio(true);
    try {
      const azureKey = localStorage.getItem("azureKey");
      const azureRegion = localStorage.getItem("azureRegion");
      if (!azureKey || !azureRegion) throw new Error("Missing Azure Keys.");
      const wavBlob = await convertAudioToWav(audioBlob);
      const assessParams = {
        ReferenceText: recordingVocabItem.word,
        GradingSystem: "HundredMark",
        Granularity: "Phoneme",
        Dimension: "Comprehensive",
      };
      const paramsHeader = btoa(JSON.stringify(assessParams));
      const url = `https://${azureRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`;
      const response = await axios.post(url, wavBlob, {
        headers: {
          "Ocp-Apim-Subscription-Key": azureKey,
          "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
          Accept: "application/json",
          "Pronunciation-Assessment": paramsHeader,
        },
      });
      const data = response.data;
      if (data.NBest && data.NBest[0]) {
        const result = data.NBest[0];
        const score =
          result.PronunciationAssessment?.AccuracyScore || result.AccuracyScore;
        setAssessmentResult({ AccuracyScore: score, Words: result.Words });

        if (recordingVocabItem.id !== "temp") {
          await axios.patch(
            `https://localhost:5001/vocabulary/${recordingVocabItem.id}/score`,
            { score: Math.round(score) },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          fetchVocabs(page);
        }
      } else {
        setAssessmentError("Could not recognize speech.");
      }
    } catch (err: any) {
      setAssessmentError(err.message);
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const handleSpeak = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.name.includes("Aria") || v.name.includes("Google US English")
    );
    if (preferredVoice) utterance.voice = preferredVoice;
    window.speechSynthesis.speak(utterance);
  };

  return {
    isAssessmentModalOpen,
    setIsAssessmentModalOpen,
    recordingVocabItem,
    isRecording,
    assessmentResult,
    assessmentError,
    isProcessingAudio,
    userAudioUrl,
    startRecording,
    stopRecording,
    handleOpenAssessment,
    handleSpeak,
  };
};

export default usePronunciationAssessment;
