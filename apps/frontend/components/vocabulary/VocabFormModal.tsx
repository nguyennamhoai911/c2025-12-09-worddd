import React, { useState, useEffect } from "react";
import axios from "axios";
import { MicrophoneIcon, SpeakerIcon } from "@/components/Icons";

interface VocabFormData {
  word: string;
  meaning: string;
  example: string;
  topic: string;
  partOfSpeech: string;
  relatedWords: string;
  pronunciation: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData: VocabFormData;
  isEditMode: boolean;
  onSave: (data: VocabFormData) => void;
  // Removed onDelete
  onSpeak: (text: string) => void;
  onRecord: (tempData: VocabFormData) => void;
}

export default function VocabFormModal({
  isOpen, onClose, initialData, isEditMode, onSave, onSpeak, onRecord
}: Props) {
  const [formData, setFormData] = useState<VocabFormData>(initialData);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  if (!isOpen) return null;

  const fetchAutoFillData = async (word: string) => {
    if (!word) return;
    setIsAutoFilling(true);
    try {
      const [dictRes, transRes] = await Promise.all([
        axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`).catch(() => null),
        axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(word)}`).catch(() => null),
      ]);
      let newData: Partial<VocabFormData> = {};

      // Parse Dictionary
      if (dictRes?.data?.[0]) {
        const entry = dictRes.data[0];
        newData.pronunciation = entry.phonetic || entry.phonetics?.find((x: any) => x.text && x.audio)?.text;
        if (entry.meanings?.[0]) {
          newData.partOfSpeech = entry.meanings[0].partOfSpeech;
          newData.example = entry.meanings[0].definitions?.find((d: any) => d.example)?.example;
        }
      }

      // Parse Translate
      if (transRes?.data?.[0]) {
        newData.meaning = transRes.data[0].map((item: any) => item[0]).join("");
      }

      setFormData((prev) => ({ ...prev, ...newData }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsAutoFilling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-start shrink-0">
          <div className="w-full">
            <div className="text-xs uppercase tracking-wider opacity-80 mb-2">
               {isEditMode ? "Editing Vocabulary" : "Create New Vocabulary"}
            </div>
            <div className="flex items-center gap-3 w-full">
              <input
                value={formData.word}
                onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                onBlur={() => !isEditMode && fetchAutoFillData(formData.word)}
                className="bg-transparent text-4xl font-bold text-white placeholder-white/50 outline-none w-full border-b border-white/20 pb-1 focus:border-white transition-colors"
                placeholder="Word..."
                autoFocus={!isEditMode}
              />
              {isAutoFilling && <div className="text-xs text-indigo-200 animate-pulse ml-2 whitespace-nowrap">✨ Filling...</div>}
              
              {formData.word && (
                <>
                  <button onClick={() => onRecord(formData)} className="p-2 bg-white/20 rounded-full hover:bg-green-500 text-white transition-colors">
                    <MicrophoneIcon className="w-6 h-6" />
                  </button>
                  <button onClick={() => onSpeak(formData.word)} className="p-2 bg-white/20 rounded-full hover:bg-white/30 text-white">
                    <SpeakerIcon className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold ml-4">✕</button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto relative">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Pronunciation</label>
              <input value={formData.pronunciation} onChange={(e) => setFormData({ ...formData, pronunciation: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm" placeholder="/.../" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Part Of Speech</label>
              <select value={formData.partOfSpeech} onChange={(e) => setFormData({ ...formData, partOfSpeech: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
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
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Meaning</label>
            <textarea value={formData.meaning} onChange={(e) => setFormData({ ...formData, meaning: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px] text-lg font-medium text-gray-800" placeholder="Nghĩa của từ..." />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Example</label>
            <textarea value={formData.example} onChange={(e) => setFormData({ ...formData, example: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 italic text-gray-600" placeholder="Ví dụ..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Topic</label>
              <input value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Topic..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Related Words</label>
              <input value={formData.relatedWords} onChange={(e) => setFormData({ ...formData, relatedWords: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Synonyms..." />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="text-gray-600 hover:bg-gray-200 px-5 py-2 rounded-lg text-sm font-medium transition-colors">Cancel</button>
          <button onClick={() => onSave(formData)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md transform active:scale-95 transition-all">
            {isEditMode ? "Save Changes" : "Create Word"}
          </button>
        </div>
      </div>
    </div>
  );
}