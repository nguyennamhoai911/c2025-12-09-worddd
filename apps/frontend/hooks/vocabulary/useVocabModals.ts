
import { useState, useRef } from "react";
import api from "@/lib/api"; // Import api for backend calls
import axios from "axios"; // Keep for external APIs (DictionaryAPI, Translate)
import { VocabItem } from "./useVocabData";

export interface VocabFormData {
  word: string;
  meaning: string;
  example: string;
  topic: string;
  partOfSpeech: string;
  relatedWords: string;
  pronunciation: string;
}

const useVocabModals = (
  token: string | null,
  fetchVocabs: (page?: number) => void,
  upsertVocab: (item: VocabItem) => void,
  removeVocab: (id: string) => void,
  refreshCache: () => void
) => {
  const [selectedVocab, setSelectedVocab] = useState<VocabItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [formData, setFormData] = useState<VocabFormData>({
    word: "",
    meaning: "",
    example: "",
    topic: "",
    partOfSpeech: "",
    relatedWords: "",
    pronunciation: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const triggerInteraction = async (vocab: VocabItem) => {
    try {
      const newOccurrence = (vocab.occurrence || 0) + 1;
      await api.patch(
        `/vocabulary/${vocab.id}`,
        { occurrence: newOccurrence },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) {
      console.error("Interaction update failed", e);
    }
  };

  const handleRowClick = (vocab: VocabItem) => {
    setSelectedVocab(vocab);
    setFormData({
      word: vocab.word,
      meaning: vocab.meaning || "",
      example: vocab.example || "",
      topic: vocab.topic || "",
      partOfSpeech: vocab.partOfSpeech || "",
      relatedWords: vocab.relatedWords || "",
      pronunciation: vocab.pronunciation || "",
    });
    setIsModalOpen(true);
    triggerInteraction(vocab);
  };

  const fetchAutoFillData = async (word: string) => {
    if (!word) return null;
    setIsAutoFilling(true);
    try {
      const dictPromise = axios
        .get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
        .catch(() => null);

      const translatePromise = axios
        .get(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(
            word
          )}`
        )
        .catch(() => null);

      const [dictRes, transRes] = await Promise.all([
        dictPromise,
        translatePromise,
      ]);

      let newData: Partial<VocabFormData> = { word: word };

      if (dictRes && dictRes.data && dictRes.data[0]) {
        const entry = dictRes.data[0];
        if (entry.phonetic) newData.pronunciation = entry.phonetic;
        else if (entry.phonetics && entry.phonetics.length > 0) {
          const p = entry.phonetics.find((x: any) => x.text && x.audio);
          newData.pronunciation = p ? p.text : entry.phonetics[0].text;
        }
        if (entry.meanings && entry.meanings.length > 0) {
          const meaning = entry.meanings[0];
          newData.partOfSpeech = meaning.partOfSpeech;
          if (meaning.definitions) {
            const defWithExample = meaning.definitions.find(
              (d: any) => d.example
            );
            if (defWithExample) newData.example = defWithExample.example;
          }
        }
      }

      if (transRes && transRes.data && transRes.data[0]) {
        const translatedText = transRes.data[0]
          .map((item: any) => item[0])
          .join("");
        newData.meaning = translatedText;
      }
      return newData;
    } catch (error) {
      console.error("Auto-fill error:", error);
      return null;
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleOpenCreateModal = async (initialWord = "") => {
    setSelectedVocab(null);
    setIsModalOpen(true);
    setFormData({
      word: initialWord,
      meaning: "",
      example: "",
      topic: "",
      partOfSpeech: "",
      relatedWords: "",
      pronunciation: "",
    });
    if (initialWord) {
      const autoData = await fetchAutoFillData(initialWord);
      if (autoData) {
        setFormData((prev) => ({ ...prev, ...autoData }));
      }
    }
  };

  const handleSave = async () => {
    if (!token || !formData.word) {
      alert("Word is required!");
      return;
    }
    try {
      if (selectedVocab) {
        const response = await api.patch(
          `/vocabulary/${selectedVocab.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const updatedItem =
          response.data?.data || response.data || {
            ...selectedVocab,
            ...formData,
          };
        upsertVocab(updatedItem);
      } else {
        const response = await api.post(
          "/vocabulary",
          { ...formData, isStarred: false },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const createdItem =
          response.data?.data || response.data || { ...formData };
        upsertVocab(createdItem);
      }
      setIsModalOpen(false);
      fetchVocabs();
    } catch (error) {
      console.error("Save failed", error);
      alert("Failed to save.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this word?")) return;
    try {
      await api.delete(`/vocabulary/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      removeVocab(id);
      fetchVocabs();
      setIsModalOpen(false);
    } catch (e) {
      alert("Failed");
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      setIsUploading(true);
      await api.post(
        "/vocabulary/import/csv",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      alert("Import success!");
      refreshCache();
      fetchVocabs(1);
    } catch (error) {
      alert("Import failed!");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return {
    selectedVocab,
    isModalOpen,
    setIsModalOpen,
    isAutoFilling,
    formData,
    setFormData,
    fileInputRef,
    isUploading,
    handleRowClick,
    handleOpenCreateModal,
    handleSave,
    handleDelete,
    handleFileChange,
    fetchAutoFillData,
  };
};

export default useVocabModals;
