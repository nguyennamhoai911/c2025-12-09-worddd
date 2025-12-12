
import { useState, useRef } from "react";
import axios from "axios";
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
  fetchVocabs: (page?: number) => void
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
      await axios.patch(
        `https://localhost:5001/vocabulary/${vocab.id}`,
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
        await axios.patch(
          `https://localhost:5001/vocabulary/${selectedVocab.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          "https://localhost:5001/vocabulary",
          { ...formData, isStarred: false },
          { headers: { Authorization: `Bearer ${token}` } }
        );
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
      await axios.delete(`https://localhost:5001/vocabulary/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      await axios.post(
        "https://localhost:5001/vocabulary/import/csv",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      alert("Import success!");
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
