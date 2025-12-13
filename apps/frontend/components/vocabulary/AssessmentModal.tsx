import React from "react";
import { MicrophoneIcon, SpeakerIcon } from "@/components/Icons";
import { AssessmentResult } from "@/hooks/vocabulary/usePronunciationAssessment";
import { VocabItem } from "@/hooks/vocabulary/useVocabData";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  vocabItem: VocabItem | null;
  isRecording: boolean;
  assessmentResult: AssessmentResult | null;
  assessmentError: string;
  isProcessingAudio: boolean;
  userAudioUrl: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  handleSpeak: (text: string, e?: React.MouseEvent) => void;
}

export default function AssessmentModal({
  isOpen,
  onClose,
  vocabItem,
  isRecording,
  assessmentResult,
  assessmentError,
  isProcessingAudio,
  userAudioUrl,
  startRecording,
  stopRecording,
  handleSpeak,
}: Props) {
  if (!isOpen || !vocabItem) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[2147483649] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center p-8 relative animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
        <h3 className="text-3xl font-bold text-gray-800 mb-1">
          {vocabItem.word}
        </h3>
        <div className="flex flex-col items-center gap-1 mb-6">
          {vocabItem.pronunciation && (
            <span className="font-mono text-gray-500 text-lg">
              /{vocabItem.pronunciation}/
            </span>
          )}
          {vocabItem.meaning && (
            <span className="text-gray-600 text-center font-medium px-4 line-clamp-2">
              {vocabItem.meaning}
            </span>
          )}
        </div>
        {assessmentResult ? (
          <div
            className="relative w-32 h-32 mb-6 flex items-center justify-center rounded-full border-8 transition-all duration-500 ease-out"
            style={{
              borderColor:
                assessmentResult.AccuracyScore >= 80
                  ? "#4caf50"
                  : assessmentResult.AccuracyScore >= 60
                  ? "#ffeb3b"
                  : "#ff5252",
            }}
          >
            <span
              className="text-4xl font-bold"
              style={{
                color:
                  assessmentResult.AccuracyScore >= 80
                    ? "#4caf50"
                    : assessmentResult.AccuracyScore >= 60
                    ? "#fbc02d"
                    : "#ff5252",
              }}
            >
              {Math.round(assessmentResult.AccuracyScore)}
            </span>
          </div>
        ) : (
          <div className="w-32 h-32 mb-6 rounded-full border-4 border-gray-100 flex items-center justify-center bg-gray-50">
            <span className="text-4xl text-gray-300">?</span>
          </div>
        )}
        <div className="mb-6 flex gap-6 items-center">
          <button
            onClick={(e) => handleSpeak(vocabItem.word, e)}
            className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 text-indigo-600 flex items-center justify-center transition-transform hover:scale-105 shadow-sm"
            title="Nghe giọng chuẩn"
          >
            <SpeakerIcon className="w-6 h-6" />
          </button>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105 ${
              isRecording
                ? "bg-red-500 animate-pulse ring-4 ring-red-200"
                : "bg-indigo-600 hover:bg-indigo-700 ring-4 ring-indigo-100"
            }`}
          >
            {isRecording ? (
              <div className="w-6 h-6 bg-white rounded-sm" />
            ) : (
              <MicrophoneIcon className="w-8 h-8 text-white" />
            )}
          </button>
          <button
            disabled={!userAudioUrl}
            onClick={() => {
              const audio = new Audio(userAudioUrl!);
              audio.play();
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-sm ${
              userAudioUrl
                ? "bg-green-100 hover:bg-green-200 text-green-700 cursor-pointer"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
            title="Nghe lại giọng bạn"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
        {isProcessingAudio && (
          <p className="text-indigo-500 font-medium animate-pulse">
            Analyzing...
          </p>
        )}
        {assessmentError && (
          <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
            {assessmentError}
          </p>
        )}
        {assessmentResult && (
          <div className="w-full bg-gray-50 rounded-xl p-4 mt-2 border border-gray-100">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
              {assessmentResult.Words.map((word, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span
                    className={`text-lg font-bold ${
                      word.AccuracyScore >= 80
                        ? "text-green-700"
                        : word.AccuracyScore >= 60
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {word.Word}
                  </span>
                  <div className="flex gap-0.5 mt-1">
                    {word.Phonemes?.map((p, pIdx) => (
                      <span
                        key={pIdx}
                        className={`text-xs px-1 rounded min-w-[20px] text-center ${
                          p.AccuracyScore >= 80
                            ? "bg-green-100 text-green-800"
                            : p.AccuracyScore >= 60
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                        title={`/${p.Phoneme}/: ${p.AccuracyScore}`}
                      >
                        {p.Phoneme}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}