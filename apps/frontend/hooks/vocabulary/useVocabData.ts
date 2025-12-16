
import { useState, useCallback, useEffect, useRef } from "react";
import api from "@/lib/api"; // Import api

// --- INTERFACES ---
export interface VocabItem {
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

export interface FilterState {
  word: string;
  topic: string;
  partOfSpeech: string;
  meaning: string;
}

export interface SortState {
  key: string;
  direction: "asc" | "desc";
}

const useVocabData = (token: string | null) => {
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

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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
        const res = await api.get("/vocabulary", {
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
    const newSortConfig = { key, direction };
    setSortConfig(newSortConfig);
    fetchVocabs(1, filters, newSortConfig);
  };

  const handleToggleStar = async (
    id: string,
    currentStatus: boolean,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    
    // Optimistic update
    const toggleFunc = (list: VocabItem[]) =>
    list.map((item) =>
      item.id === id ? { ...item, isStarred: !currentStatus } : item
    );
    setVocabs(toggleFunc);

    try {
      await api.patch(
        `/vocabulary/${id}`,
        { isStarred: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Failed to star", error);
      // Revert on failure
      setVocabs((prev) => 
        prev.map((item) =>
          item.id === id ? { ...item, isStarred: currentStatus } : item
        )
      );
    }
  };

  const triggerInteraction = async (vocab: VocabItem) => {
    try {
      const newOccurrence = (vocab.occurrence || 0) + 1;
      const newTime = new Date().toISOString();
      
      // Optimistic update
      setVocabs((prev) =>
        prev.map((v) =>
          v.id === vocab.id
            ? { ...v, occurrence: newOccurrence, updatedAt: newTime }
            : v
        )
      );
      
      await api.patch(
        `/vocabulary/${vocab.id}`,
        { occurrence: newOccurrence },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) {
      console.error("Interaction update failed", e);
       // Revert on failure
       setVocabs((prev) =>
       prev.map((v) =>
         v.id === vocab.id
           ? { ...v, occurrence: vocab.occurrence, updatedAt: vocab.updatedAt }
           : v
       )
     );
    }
  };

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

  return {
    vocabs,
    loading,
    page,
    setPage,
    totalPages,
    showStarredOnly,
    setShowStarredOnly,
    filters,
    sortConfig,
    columnOrder,
    draggedCol,
    fetchVocabs,
    handleFilterChange,
    handleSort,
    handleToggleStar,
    triggerInteraction,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
};

export default useVocabData;
