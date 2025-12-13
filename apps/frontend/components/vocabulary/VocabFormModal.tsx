
import React from "react";
import { MicrophoneIcon, SpeakerIcon } from "@/components/Icons";
import { VocabFormData } from "@/hooks/vocabulary/useVocabModals";
import { VocabItem } from "@/hooks/vocabulary/useVocabData";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData: VocabFormData;
  setInitialData: (data: VocabFormData) => void;
  isEditMode: boolean;
  onSave: () => void;
  onDelete: (() => void) | undefined;
  isAutoFilling: boolean;
  fetchAutoFillData: (word: string) => Promise<Partial<VocabFormData> | null>;
  handleOpenAssessment: (item: VocabFormData, e?: React.MouseEvent) => void;
  handleSpeak: (text: string, e?: React.MouseEvent) => void;
  selectedVocab: VocabItem | null;
}

export default function VocabFormModal({
  isOpen,
  onClose,
  initialData: formData,
  setInitialData: setFormData,
  isEditMode,
  onSave,
  onDelete,
  isAutoFilling,
  fetchAutoFillData,
  handleOpenAssessment,
  handleSpeak,
  selectedVocab,
}: Props) {
  if (!isOpen) return null;

  const handleAutoFill = async () => {
    if (!isEditMode) {
      const autoData = await fetchAutoFillData(formData.word);
      if (autoData) {
        setFormData({ ...formData, ...autoData });
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-start shrink-0">
          <div className="w-full">
            <div className="text-xs uppercase tracking-wider opacity-80 mb-2">
              {isEditMode ? "Editing Vocabulary" : "Create New Vocabulary"}
            </div>
            <div className="flex items-center gap-3 w-full">
              <input
                value={formData.word || ""}
                onChange={(e) =>
                  setFormData({ ...formData, word: e.target.value })
                }
                onBlur={handleAutoFill}
                className="bg-transparent text-4xl font-bold text-white placeholder-white/50 outline-none w-full border-b border-white/20 pb-1 focus:border-white transition-colors"
                placeholder="Word..."
                autoFocus={!isEditMode}
              />

              {isAutoFilling && (
                <div className="text-xs text-indigo-200 animate-pulse ml-2 whitespace-nowrap">
                  ✨ Auto-filling...
                </div>
              )}

              {formData.word && (
                <>
                  <button
                    onClick={(e) => handleOpenAssessment(formData, e)}
                    className="p-2 bg-white/20 rounded-full hover:bg-green-500 text-white transition-colors"
                  >
                    <MicrophoneIcon className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => handleSpeak(formData.word, e)}
                    className="p-2 bg-white/20 rounded-full hover:bg-white/30 text-white"
                  >
                    <SpeakerIcon className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-2xl font-bold ml-4"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-5 overflow-y-auto relative">
          {isAutoFilling && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                Pronunciation
              </label>
              <input
                value={formData.pronunciation || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pronunciation: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                placeholder="/.../"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                Part Of Speech
              </label>
              <select
                value={formData.partOfSpeech || ""}
                onChange={(e) =>
                  setFormData({ ...formData, partOfSpeech: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="">-- Select --</option>
                <option value="noun">Noun</option>
                <option value="verb">Verb</option>
                <option value="adjective">Adjective</option>
                <option value="adverb">Adverb</option>
                <option value="phrase">Phrase</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
              Meaning
            </label>
            <textarea
              value={formData.meaning || ""}
              onChange={(e) =>
                setFormData({ ...formData, meaning: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px] text-lg font-medium text-gray-800"
              placeholder="Nghĩa của từ..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
              Example
            </label>
            <textarea
              value={formData.example || ""}
              onChange={(e) =>
                setFormData({ ...formData, example: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 italic text-gray-600"
              placeholder="Ví dụ..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                Topic
              </label>
              <input
                value={formData.topic || ""}
                onChange={(e) =>
                  setFormData({ ...formData, topic: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="IT, Travel..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                Related Words
              </label>
              <input
                value={formData.relatedWords || ""}
                onChange={(e) =>
                  setFormData({ ...formData, relatedWords: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Synonyms..."
              />
            </div>
          </div>
        </div>
        <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center shrink-0">
          {selectedVocab ? (
            <div className="text-xs text-gray-400">
              Updated: {new Date(selectedVocab.updatedAt).toLocaleString()}
            </div>
          ) : (
            <div></div>
          )}
          <div className="flex gap-3">
            {isEditMode && onDelete && (
              <button
                onClick={onDelete}
                className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-red-200"
              >
                Delete
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-600 hover:bg-gray-200 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md transform active:scale-95 transition-all"
            >
              {isEditMode ? "Save Changes" : "Create Word"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
