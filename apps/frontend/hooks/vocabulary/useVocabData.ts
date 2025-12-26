
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
  const [allVocabs, setAllVocabs] = useState<VocabItem[]>([]);
  const allVocabsRef = useRef<VocabItem[]>([]);
  const [isCacheReady, setIsCacheReady] = useState(false);
  const cacheHydratingRef = useRef(false);
  const pageSize = 20;

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

  const applyLocalQuery = useCallback(
    (
      source: VocabItem[],
      pageNum: number,
      currentFilters: FilterState,
      currentSort: SortState,
      starred: boolean
    ) => {
      const normalizedFilters = {
        word: currentFilters.word.toLowerCase().trim(),
        topic: currentFilters.topic.toLowerCase().trim(),
        partOfSpeech: currentFilters.partOfSpeech.toLowerCase().trim(),
        meaning: currentFilters.meaning.toLowerCase().trim(),
      };

      const filtered = source.filter((item) => {
        if (starred && !item.isStarred) return false;
        const matchesWord = normalizedFilters.word
          ? item.word?.toLowerCase().includes(normalizedFilters.word)
          : true;
        const matchesTopic = normalizedFilters.topic
          ? item.topic?.toLowerCase().includes(normalizedFilters.topic)
          : true;
        const matchesPos = normalizedFilters.partOfSpeech
          ? item.partOfSpeech
              ?.toLowerCase()
              .includes(normalizedFilters.partOfSpeech)
          : true;
        const matchesMeaning = normalizedFilters.meaning
          ? item.meaning?.toLowerCase().includes(normalizedFilters.meaning)
          : true;
        return matchesWord && matchesTopic && matchesPos && matchesMeaning;
      });

      const sorted = [...filtered].sort((a, b) => {
        const key = currentSort.key as keyof VocabItem;
        const aVal = a[key];
        const bVal = b[key];
        const isDateField = key === "updatedAt" || key === "createdAt";
        const aComparable = isDateField
          ? new Date(aVal || 0).getTime()
          : typeof aVal === "number"
          ? aVal
          : (aVal || "").toString().toLowerCase();
        const bComparable = isDateField
          ? new Date(bVal || 0).getTime()
          : typeof bVal === "number"
          ? bVal
          : (bVal || "").toString().toLowerCase();

        if (aComparable < bComparable) return -1;
        if (aComparable > bComparable) return 1;
        return 0;
      });

      if (currentSort.direction === "desc") {
        sorted.reverse();
      }

      const newTotalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
      const safePage = Math.min(pageNum, newTotalPages);
      const start = (safePage - 1) * pageSize;
      const end = start + pageSize;

      return {
        items: sorted.slice(start, end),
        totalPages: newTotalPages,
        page: safePage,
      };
    },
    [pageSize]
  );

  const hydrateLocalCache = useCallback(async () => {
    if (!token || cacheHydratingRef.current) return;
    cacheHydratingRef.current = true;
    setLoading(true);
    try {
      let currentPage = 1;
      let lastPage = 1;
      const merged: VocabItem[] = [];

      do {
        const res = await api.get("/vocabulary", {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page: currentPage,
            limit: 2000,
            sortBy: "updatedAt",
            sortOrder: "desc",
          },
        });
        merged.push(...(res.data.data || []));
        lastPage = res.data.meta?.lastPage || currentPage;
        currentPage += 1;
      } while (currentPage <= lastPage);

      setAllVocabs(merged);
      allVocabsRef.current = merged;
      setIsCacheReady(true);

      const localResult = applyLocalQuery(
        merged,
        1,
        filters,
        sortConfig,
        showStarredOnly
      );
      setVocabs(localResult.items);
      setTotalPages(localResult.totalPages);
      setPage(localResult.page);
    } catch (error) {
      console.error("Cache hydrate error:", error);
    } finally {
      cacheHydratingRef.current = false;
      setLoading(false);
    }
  }, [applyLocalQuery, filters, showStarredOnly, sortConfig, token]);

  const fetchVocabs = useCallback(
    async (
      pageNum = 1,
      currentFilters = filters,
      currentSort = sortConfig,
      starred = showStarredOnly
    ) => {
      if (!token) return;
      if (isCacheReady) {
        const localResult = applyLocalQuery(
          allVocabsRef.current,
          pageNum,
          currentFilters,
          currentSort,
          starred
        );
        setVocabs(localResult.items);
        setTotalPages(localResult.totalPages);
        setPage(localResult.page);
        return;
      }

      setLoading(true);
      try {
        const params: any = {
          page: pageNum,
          limit: pageSize,
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
    [token, filters, sortConfig, showStarredOnly, isCacheReady, applyLocalQuery]
  );

  useEffect(() => {
    fetchVocabs();
  }, [fetchVocabs]);

  useEffect(() => {
    hydrateLocalCache();
  }, [hydrateLocalCache]);

  useEffect(() => {
    if (!token) {
      setAllVocabs([]);
      allVocabsRef.current = [];
      setIsCacheReady(false);
    }
  }, [token]);
  
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

  const updateLocalCache = useCallback((updater: (items: VocabItem[]) => VocabItem[]) => {
    setAllVocabs((prev) => {
      const next = updater(prev);
      allVocabsRef.current = next;
      return next;
    });
  }, []);

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
    updateLocalCache(toggleFunc);

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
      updateLocalCache((prev) =>
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
      updateLocalCache((prev) =>
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
     updateLocalCache((prev) =>
       prev.map((v) =>
         v.id === vocab.id
           ? { ...v, occurrence: vocab.occurrence, updatedAt: vocab.updatedAt }
           : v
       )
     );
    }
  };

  const upsertVocab = useCallback((item: VocabItem) => {
    if (!item) return;
    updateLocalCache((prev) => {
      const index = prev.findIndex((v) => v.id === item.id);
      if (index === -1) return [item, ...prev];
      const next = [...prev];
      next[index] = { ...prev[index], ...item };
      return next;
    });
  }, [updateLocalCache]);

  const removeVocab = useCallback((id: string) => {
    if (!id) return;
    updateLocalCache((prev) => prev.filter((v) => v.id !== id));
  }, [updateLocalCache]);

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
    upsertVocab,
    removeVocab,
    refreshCache: hydrateLocalCache,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
};

export default useVocabData;
