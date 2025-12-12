"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams, usePathname } from "next/navigation";
import axios from "axios";

// --- HELPER: WAV ENCODER ---
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

// --- INTERFACES ---
interface VocabItem {
  id: string;
  word: string;
  topic?: string | null;
  partOfSpeech?: string | null;
  pronunciation?: string | null;
  meaning?: string | null;
  example?: string | null;
  relatedWords?: string | null;
  occurrence: number;
  isStarred: boolean;
  pronunciationScores: number[];
  createdAt: string;
  updatedAt: string;
}

interface AssessmentResult {
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

interface FilterState {
  word: string;
  topic: string;
  partOfSpeech: string;
  meaning: string;
}

interface SortState {
  key: string;
  direction: "asc" | "desc";
}

interface VocabFormData {
  word: string;
  meaning: string;
  example: string;
  topic: string;
  partOfSpeech: string;
  relatedWords: string;
  pronunciation: string;
}

export default function VocabularyPage() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const pathname = usePathname(); // 👈 Thêm dòng này

  // --- STATES ---
  const [vocabs, setVocabs] = useState<VocabItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    word: "",
    topic: "",
    partOfSpeech: "",
    meaning: "",
  });
  const [sortConfig, setSortConfig] = useState<SortState>({
    key: "updatedAt",
    direction: "desc",
  });

  // --- RECORDING & ASSESSMENT STATES ---
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

  // --- DRAG & DROP COLUMN STATE ---
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "star",
    "updatedAt",
    "topic",
    "word",
    "pronunciation",
    "meaning",
    "example",
    "relatedWords",
    "occurrence",
    "score",
    "actions",
  ]);
  const [draggedCol, setDraggedCol] = useState<string | null>(null);

  // --- QUICK SEARCH & MODAL STATES ---
  const [showSearch, setShowSearch] = useState(false);
  const [quickSearchText, setQuickSearchText] = useState("");
  const [quickSearchResults, setQuickSearchResults] = useState<VocabItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // 👇 Khai báo Ref ở đây trước
  const searchInputRef = useRef<HTMLInputElement>(null);
  const quickSearchDebounce = useRef<NodeJS.Timeout | null>(null);

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
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 👇 [MOVED HERE] Đoạn logic xử lý URL Rewrite được chuyển xuống đây
  // để đảm bảo các biến state (setShowSearch) và ref (searchInputRef) đã được khởi tạo
  // 👇 Đoạn check URL để mở popup
  useEffect(() => {
    // Check xem đường dẫn hiện tại có kết thúc bằng "/search" không
    const isSearchPath = pathname?.endsWith('/search');
    
    // Hoặc check theo cách cũ (đề phòng)
    const hasSearchParam = searchParams.get('openSearch') === 'true';

    if (isSearchPath || hasSearchParam) {
      setShowSearch(true);     // Mở Modal
      setQuickSearchText("");  // Reset text
      
      // Delay xíu để modal hiện ra rồi mới focus vào ô nhập liệu
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  }, [pathname, searchParams]); // 👈 Nhớ có pathname trong dependency

  // --- FETCH DATA ---
  const fetchVocabs = useCallback(
    async (
      pageNum = 1,
      currentFilters = filters,
      currentSort = sortConfig,
      starred = showStarredOnly
    ) => {
      if (!token) return;
      setLoading(true);
      try {
        const params: any = {
          page: pageNum,
          limit: 20,
          ...currentFilters,
          sortBy: currentSort.key,
          sortOrder: currentSort.direction,
        };
        if (starred) params.isStarred = "true";
        const res = await axios.get("http://localhost:5000/vocabulary", {
          headers: { Authorization: `Bearer ${token}` },
          params: params,
        });
        setVocabs(res.data.data);
        setTotalPages(res.data.meta.lastPage);
        setPage(res.data.meta.page);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    },
    [token, filters, sortConfig, showStarredOnly]
  );

  useEffect(() => {
    fetchVocabs();
  }, [fetchVocabs]);

  // ==========================================
  // DOUBLE SPACE SHORTCUT LOGIC
  // ==========================================
  useEffect(() => {
    let lastKeyPressTime = 0;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore inputs
      if ((e.target as HTMLElement).tagName === "INPUT" && !showSearch) return;
      if ((e.target as HTMLElement).tagName === "TEXTAREA") return;

      // Handle Double Space
      if (e.code === "Space") {
        const currentTime = new Date().getTime();
        if (currentTime - lastKeyPressTime < 300) {
          e.preventDefault();
          setShowSearch(true);
          setQuickSearchText("");
          setQuickSearchResults([]);
          setTimeout(() => searchInputRef.current?.focus(), 100);
        }
        lastKeyPressTime = currentTime;
      }
      // Handle Escape
      if (e.code === "Escape") {
        setShowSearch(false);
        setIsModalOpen(false);
        setIsAssessmentModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearch]);

  // ==========================================
  // PRONUNCIATION LOGIC
  // ==========================================

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

  // Auto-record when assessment modal opens
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

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

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

        // Save score if real item
        if (recordingVocabItem.id !== "temp") {
          await axios.patch(
            `http://localhost:5000/vocabulary/${recordingVocabItem.id}/score`,
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

  // ==========================================
  // HANDLERS
  // ==========================================

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

  const triggerInteraction = async (vocab: VocabItem) => {
    try {
      const newOccurrence = (vocab.occurrence || 0) + 1;
      const newTime = new Date().toISOString();
      setVocabs((prev) =>
        prev.map((v) =>
          v.id === vocab.id
            ? { ...v, occurrence: newOccurrence, updatedAt: newTime }
            : v
        )
      );
      await axios.patch(
        `http://localhost:5000/vocabulary/${vocab.id}`,
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

  const handleSave = async () => {
    if (!token || !formData.word) {
      alert("Word is required!");
      return;
    }
    try {
      if (selectedVocab) {
        await axios.patch(
          `http://localhost:5000/vocabulary/${selectedVocab.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          "http://localhost:5000/vocabulary",
          { ...formData, isStarred: false },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setIsModalOpen(false);
      setQuickSearchText("");
      fetchVocabs(page);
    } catch (error) {
      console.error("Save failed", error);
      alert("Failed to save.");
    }
  };

  const handleToggleStar = async (
    id: string,
    currentStatus: boolean,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    const toggleFunc = (list: VocabItem[]) =>
      list.map((item) =>
        item.id === id ? { ...item, isStarred: !currentStatus } : item
      );
    setVocabs(toggleFunc);
    setQuickSearchResults(toggleFunc);
    try {
      await axios.patch(
        `http://localhost:5000/vocabulary/${id}`,
        { isStarred: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Failed to star", error);
    }
  };

  // --- DRAG & DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, colId: string) => {
    setDraggedCol(colId);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (!draggedCol || draggedCol === colId) return;
    const newOrder = [...columnOrder];
    const draggedIdx = newOrder.indexOf(draggedCol);
    const targetIdx = newOrder.indexOf(colId);
    if (draggedIdx !== -1 && targetIdx !== -1) {
      newOrder.splice(draggedIdx, 1);
      newOrder.splice(targetIdx, 0, draggedCol);
      setColumnOrder(newOrder);
    }
  };
  const handleDragEnd = () => {
    setDraggedCol(null);
  };

  // --- COLUMN CONFIGURATION ---
  const columnConfig: Record<
    string,
    {
      label: React.ReactNode;
      width: string;
      renderCell: (v: VocabItem) => React.ReactNode;
      renderFilter?: () => React.ReactNode;
      sortKey?: string;
    }
  > = {
    star: {
      label: "★",
      width: "w-12",
      sortKey: "isStarred",
      renderCell: (v) => (
        <button
          onClick={(e) => handleToggleStar(v.id, v.isStarred, e)}
          className="hover:bg-gray-100 rounded-full p-1"
        >
          <StarIcon
            filled={v.isStarred}
            className={
              v.isStarred ? "text-yellow-400 w-5 h-5" : "text-gray-300 w-5 h-5"
            }
          />
        </button>
      ),
    },
    updatedAt: {
      label: "Last Active",
      width: "w-32",
      sortKey: "updatedAt",
      renderCell: (v) => (
        <div className="font-mono text-xs text-gray-500">
          {new Date(v.updatedAt).toLocaleDateString()} <br />
          <span className="text-gray-400">
            {new Date(v.updatedAt).toLocaleTimeString()}
          </span>
        </div>
      ),
    },
    topic: {
      label: "Topic",
      width: "w-32",
      sortKey: "topic",
      renderCell: (v) =>
        v.topic && (
          <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
            {v.topic}
          </span>
        ),
      renderFilter: () => (
        <input
          className="w-full border rounded px-2 py-1 text-xs outline-none focus:border-indigo-500"
          placeholder="Filter..."
          value={filters.topic}
          onChange={(e) => handleFilterChange("topic", e.target.value)}
        />
      ),
    },
    word: {
      label: "Word",
      width: "w-48",
      sortKey: "word",
      renderCell: (v) => (
        <div className="flex items-center justify-between gap-2 font-bold text-indigo-700">
          <span>{v.word}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                handleOpenAssessment(v, e);
                triggerInteraction(v);
              }}
              className="text-gray-400 hover:text-green-600 p-1 rounded-full hover:bg-green-50"
              title="Practice Pronunciation"
            >
              <MicrophoneIcon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                handleSpeak(v.word, e);
                triggerInteraction(v);
              }}
              className="text-gray-400 hover:text-indigo-600 p-1 rounded-full hover:bg-indigo-50"
            >
              <SpeakerIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      ),
      renderFilter: () => (
        <input
          className="w-full border rounded px-2 py-1 text-xs outline-none focus:border-indigo-500"
          placeholder="Filter..."
          value={filters.word}
          onChange={(e) => handleFilterChange("word", e.target.value)}
        />
      ),
    },
    pronunciation: {
      label: "Pronun.",
      width: "w-32",
      renderCell: (v) => (
        <span className="font-mono text-gray-500 text-xs">
          {v.pronunciation}
        </span>
      ),
    },
    meaning: {
      label: "Meaning",
      width: "w-48",
      renderCell: (v) => (
        <span
          className="text-gray-800 text-sm line-clamp-2"
          title={v.meaning || ""}
        >
          {v.meaning}
        </span>
      ),
      renderFilter: () => (
        <input
          className="w-full border rounded px-2 py-1 text-xs outline-none focus:border-indigo-500"
          placeholder="Meaning..."
          value={filters.meaning}
          onChange={(e) => handleFilterChange("meaning", e.target.value)}
        />
      ),
    },
    example: {
      label: "Example",
      width: "w-64",
      renderCell: (v) => (
        <span
          className="italic text-gray-500 text-xs line-clamp-2"
          title={v.example || ""}
        >
          {v.example}
        </span>
      ),
    },
    relatedWords: {
      label: "Related",
      width: "w-40",
      renderCell: (v) => (
        <span className="text-gray-500 text-xs">{v.relatedWords}</span>
      ),
    },
    occurrence: {
      label: "Count",
      width: "w-20",
      sortKey: "occurrence",
      renderCell: (v) => (
        <div className="text-center font-semibold text-gray-500">
          {v.occurrence}
        </div>
      ),
    },
    score: {
      label: "Score",
      width: "w-20",
      renderCell: (v) => {
        const scores = v.pronunciationScores || [];
        if (scores.length === 0)
          return <span className="text-gray-300 text-xs">-</span>;
        const recentScores = scores.slice(-3);
        const avg = Math.round(
          recentScores.reduce((a, b) => a + b, 0) / recentScores.length
        );
        let colorClass = "bg-red-100 text-red-700";
        if (avg >= 80) colorClass = "bg-green-100 text-green-700";
        else if (avg >= 60) colorClass = "bg-yellow-100 text-yellow-700";
        return (
          <div className="flex flex-col items-center">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${colorClass}`}
            >
              {avg}
            </span>
          </div>
        );
      },
    },
    actions: {
      label: "Action",
      width: "w-20",
      renderCell: (v) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(v);
          }}
          className="text-indigo-600 text-xs border border-indigo-200 px-2 py-1 rounded hover:bg-indigo-50"
        >
          Edit
        </button>
      ),
    },
  };

  // --- AUTO FILL LOGIC ---
  const fetchAutoFillData = async (word: string) => {
    if (!word) return null;
    setIsAutoFilling(true);
    try {
      // 1. Dictionary API
      const dictPromise = axios
        .get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
        .catch(() => null);

      // 2. Google Translate
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

      // Parse Dictionary
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

      // Parse Translate
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
    setShowSearch(false);
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

  const handleQuickSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setQuickSearchText(text);
    if (quickSearchDebounce.current) clearTimeout(quickSearchDebounce.current);
    quickSearchDebounce.current = setTimeout(
      () => performQuickSearch(text),
      300
    );
  };

  const performQuickSearch = async (text: string) => {
    if (!token || !text.trim()) {
      setQuickSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await axios.get("http://localhost:5000/vocabulary", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: 1,
          limit: 5,
          search: text,
          sortBy: "word",
          sortOrder: "asc",
        },
      });
      setQuickSearchResults(res.data.data);
    } catch (error) {
      console.error("Quick search error", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this word?")) return;
    try {
      await axios.delete(`http://localhost:5000/vocabulary/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchVocabs(page, filters, sortConfig);
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
        "http://localhost:5000/vocabulary/import/csv",
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

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => fetchVocabs(1, newFilters, sortConfig),
      500
    );
  };

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
    fetchVocabs(1, filters, { key, direction });
  };

  const getSortIcon = (colKey: string) =>
    sortConfig.key !== colKey ? (
      <span className="text-gray-300 ml-1 opacity-50">↕</span>
    ) : sortConfig.direction === "asc" ? (
      <span className="ml-1 text-indigo-600">▲</span>
    ) : (
      <span className="ml-1 text-indigo-600">▼</span>
    );

  // --- CALCULATE EXACT MATCH ---
  // 👇 QUAN TRỌNG: Tính toán xem có từ nào khớp 100% không để hiện nút Create
  const hasExactMatch = quickSearchResults.some(
    (item) => item.word.toLowerCase() === quickSearchText.trim().toLowerCase()
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black relative">
      {/* --- ASSESSMENT MODAL --- */}
      {isAssessmentModalOpen && recordingVocabItem && (
        <div
          className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setIsAssessmentModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center p-8 relative animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsAssessmentModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h3 className="text-3xl font-bold text-gray-800 mb-1">
              {recordingVocabItem.word}
            </h3>
            <div className="flex flex-col items-center gap-1 mb-6">
              {recordingVocabItem.pronunciation && (
                <span className="font-mono text-gray-500 text-lg">
                  /{recordingVocabItem.pronunciation}/
                </span>
              )}
              {recordingVocabItem.meaning && (
                <span className="text-gray-600 text-center font-medium px-4 line-clamp-2">
                  {recordingVocabItem.meaning}
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
                onClick={() => handleSpeak(recordingVocabItem.word)}
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
      )}

      {/* QUICK SEARCH MODAL */}
      {showSearch && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-32 backdrop-blur-sm"
          onClick={() => setShowSearch(false)}
        >
          <div
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <span className="text-xl">🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                value={quickSearchText}
                onChange={handleQuickSearchChange}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  quickSearchResults.length === 0 &&
                  handleOpenCreateModal(quickSearchText)
                }
                placeholder="Type to search or create..."
                className="flex-1 text-xl font-light outline-none bg-transparent h-10"
              />
              <div className="text-xs text-gray-400 border border-gray-200 px-2 py-1 rounded">
                ESC to close
              </div>
            </div>
            <div className="bg-gray-50 max-h-[60vh] overflow-y-auto">
              {isSearching ? (
                <div className="p-8 text-center text-gray-400">
                  Searching...
                </div>
              ) : (
                <>
                  {/* 👇 NÚT TẠO MỚI (LUÔN HIỆN NẾU CHƯA CÓ TỪ KHỚP 100%) */}
                  {quickSearchText && !hasExactMatch && (
                    <div
                      className="p-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center group cursor-pointer hover:bg-indigo-100 transition-colors"
                      onClick={() => handleOpenCreateModal(quickSearchText)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xl">
                          +
                        </div>
                        <div>
                          <div className="font-bold text-indigo-800">
                            Create "{quickSearchText}"
                          </div>
                          <div className="text-xs text-indigo-500">
                            Auto-fill meaning & pronunciation
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600 bg-white px-3 py-1 rounded-full shadow-sm">
                        Enter ↵
                      </span>
                    </div>
                  )}

                  {/* 👇 DANH SÁCH KẾT QUẢ TÌM ĐƯỢC */}
                  {quickSearchResults.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {quickSearchResults.map((item) => (
                        <li
                          key={item.id}
                          onClick={() => {
                            setShowSearch(false);
                            handleRowClick(item);
                          }}
                          className="p-3 hover:bg-indigo-50 cursor-pointer transition-colors group"
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-lg text-indigo-700">
                                  {item.word}
                                </span>

                                {/* Icons Action */}
                                <button
                                  onClick={(e) => handleOpenAssessment(item, e)}
                                  className="text-gray-400 hover:text-green-600 p-1 rounded-full hover:bg-green-100"
                                  title="Practice Pronunciation"
                                >
                                  <MicrophoneIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    handleSpeak(item.word, e);
                                    triggerInteraction(item);
                                  }}
                                  className="text-gray-400 hover:text-indigo-600 p-1 rounded-full hover:bg-indigo-100"
                                  title="Listen"
                                >
                                  <SpeakerIcon className="w-4 h-4" />
                                </button>

                                {item.partOfSpeech && (
                                  <span className="text-[10px] uppercase font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                                    {item.partOfSpeech}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-800 line-clamp-2">
                                {item.meaning || (
                                  <span className="italic text-gray-400">
                                    No meaning provided
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0 flex flex-col items-end gap-1">
                              {item.topic && (
                                <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                  {item.topic}
                                </span>
                              )}
                              {item.isStarred && (
                                <span className="text-yellow-400 text-xs">★</span>
                              )}
                              <span className="text-[10px] text-gray-400">
                                View: {item.occurrence}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    !hasExactMatch &&
                    quickSearchText && (
                      <div className="p-4 text-center text-gray-400 text-sm">
                        No existing words match.
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-start shrink-0">
              <div className="w-full">
                <div className="text-xs uppercase tracking-wider opacity-80 mb-2">
                  {selectedVocab
                    ? "Editing Vocabulary"
                    : "Create New Vocabulary"}
                </div>
                <div className="flex items-center gap-3 w-full">
                  <input
                    value={formData.word || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, word: e.target.value })
                    }
                    onBlur={() =>
                      !selectedVocab &&
                      fetchAutoFillData(formData.word).then(
                        (res) =>
                          res && setFormData((prev) => ({ ...prev, ...res }))
                      )
                    }
                    className="bg-transparent text-4xl font-bold text-white placeholder-white/50 outline-none w-full border-b border-white/20 pb-1 focus:border-white transition-colors"
                    placeholder="Word..."
                    autoFocus={!selectedVocab}
                  />

                  {/* 👇 HIỂN THỊ TRẠNG THÁI LOADING */}
                  {isAutoFilling && (
                    <div className="text-xs text-indigo-200 animate-pulse ml-2 whitespace-nowrap">
                      ✨ Auto-filling...
                    </div>
                  )}

                  {formData.word && (
                    <>
                      <button
                        onClick={(e) =>
                          handleOpenAssessment(
                            {
                              ...formData,
                              id: selectedVocab?.id || "temp",
                              occurrence: 0,
                              isStarred: false,
                              pronunciationScores: [],
                              createdAt: "",
                              updatedAt: "",
                            } as VocabItem,
                            e
                          )
                        }
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
                onClick={() => setIsModalOpen(false)}
                className="text-white/70 hover:text-white text-2xl font-bold ml-4"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto relative">
              {/* 👇 MÀN CHE LOADING TRONG FORM */}
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
                {selectedVocab && (
                  <button
                    onClick={() => handleDelete(selectedVocab.id)}
                    className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-red-200"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-600 hover:bg-gray-200 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md transform active:scale-95 transition-all"
                >
                  {selectedVocab ? "Save Changes" : "Create Word"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Vocabulary</h1>
          <p className="text-gray-500 text-sm mt-1">
            Double-tap{" "}
            <kbd className="bg-gray-200 px-1.5 py-0.5 rounded text-xs border border-gray-300 font-mono">
              Space
            </kbd>{" "}
            to Quick Search / Create
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => handleOpenCreateModal("")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 font-medium"
          >
            <span>+</span> New Word
          </button>
          <button
            onClick={() => {
              const newValue = !showStarredOnly;
              setShowStarredOnly(newValue);
              fetchVocabs(1, filters, sortConfig, newValue);
            }}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
              showStarredOnly
                ? "bg-yellow-50 border-yellow-400 text-yellow-700"
                : "bg-white border-gray-300 text-gray-600"
            }`}
          >
            <StarIcon
              filled={showStarredOnly}
              className={showStarredOnly ? "text-yellow-500" : "text-gray-400"}
            />
            <span className="text-sm font-medium">
              {showStarredOnly ? "Starred" : "All"}
            </span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 text-sm font-medium"
          >
            {isUploading ? "..." : "📂 CSV"}
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto pb-4">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50 select-none">
              <tr>
                {columnOrder.map((colId) => {
                  const config = columnConfig[colId];
                  if (!config) return null;
                  const isDragging = draggedCol === colId;
                  return (
                    <th
                      key={colId}
                      draggable
                      onDragStart={(e) => handleDragStart(e, colId)}
                      onDragOver={(e) => handleDragOver(e, colId)}
                      onDragEnd={handleDragEnd}
                      onClick={() =>
                        config.sortKey && handleSort(config.sortKey)
                      }
                      className={`${
                        config.width
                      } px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase border-r border-gray-200 cursor-move hover:bg-gray-100 transition-all duration-200 ${
                        isDragging
                          ? "opacity-50 bg-indigo-50 border-2 border-indigo-300 scale-95 shadow-inner"
                          : ""
                      } ${
                        colId === "actions"
                          ? "sticky right-0 bg-gray-50 shadow-l z-10"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between pointer-events-none">
                        <span>{config.label}</span>
                        {config.sortKey && getSortIcon(config.sortKey)}
                      </div>
                    </th>
                  );
                })}
              </tr>
              <tr className="bg-white border-b border-gray-200">
                {columnOrder.map((colId) => {
                  const config = columnConfig[colId];
                  if (!config) return null;
                  return (
                    <td
                      key={colId}
                      className={`p-2 border-r border-gray-100 ${
                        colId === "actions"
                          ? "sticky right-0 bg-white z-10"
                          : ""
                      }`}
                    >
                      {config.renderFilter ? config.renderFilter() : null}
                    </td>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={columnOrder.length}
                    className="text-center py-10 text-gray-500"
                  >
                    Loading data...
                  </td>
                </tr>
              ) : vocabs.length === 0 ? (
                <tr>
                  <td
                    colSpan={columnOrder.length}
                    className="text-center py-10 text-gray-500"
                  >
                    No vocabulary found.
                  </td>
                </tr>
              ) : (
                vocabs.map((vocab) => (
                  <tr
                    key={vocab.id}
                    className="hover:bg-indigo-50/50 group transition-colors cursor-pointer"
                    onClick={() => handleRowClick(vocab)}
                  >
                    {columnOrder.map((colId) => {
                      const config = columnConfig[colId];
                      if (!config) return null;
                      return (
                        <td
                          key={colId}
                          className={`px-4 py-3 text-sm border-r border-gray-100 align-top whitespace-normal break-words ${
                            colId === "actions"
                              ? "sticky right-0 bg-white group-hover:bg-indigo-50/50 shadow-l z-10"
                              : ""
                          }`}
                          onClick={
                            colId === "actions" || colId === "star"
                              ? (e) => e.stopPropagation()
                              : undefined
                          }
                        >
                          {config.renderCell(vocab)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center sticky bottom-0 z-20">
          <button
            disabled={page <= 1}
            onClick={() => {
              const newPage = page - 1;
              setPage(newPage);
              fetchVocabs(newPage, filters, sortConfig);
            }}
            className="px-4 py-2 bg-white border rounded shadow-sm hover:bg-gray-100 disabled:opacity-50 text-sm font-medium"
          >
            ← Previous
          </button>
          <span className="text-sm font-medium text-gray-600">
            Page <span className="text-indigo-600 font-bold">{page}</span> of{" "}
            {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => {
              const newPage = page + 1;
              setPage(newPage);
              fetchVocabs(newPage, filters, sortConfig);
            }}
            className="px-4 py-2 bg-white border rounded shadow-sm hover:bg-gray-100 disabled:opacity-50 text-sm font-medium"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

// --- ICONS ---
function StarIcon({
  filled,
  className,
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? "0" : "2"}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width="24"
      height="24"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    </svg>
  );
}
function MicrophoneIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="23"></line>
      <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
  );
}

