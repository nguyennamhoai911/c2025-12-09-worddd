import { useState, useRef, useEffect } from "react";
import api from "@/lib/api"; // Import api
import { useSearchParams, usePathname } from "next/navigation";
import { VocabItem } from "./useVocabData";

const useQuickSearch = (
  token: string | null,
  handleOpenCreateModal: (word: string) => void
) => {
  const [showSearch, setShowSearch] = useState(false);
  const [quickSearchText, setQuickSearchText] = useState("");
  const [quickSearchResults, setQuickSearchResults] = useState<VocabItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const quickSearchDebounce = useRef<NodeJS.Timeout | null>(null);

  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const isSearchPath = pathname?.endsWith("/search");
    const hasSearchParam = searchParams.get("openSearch") === "true";

    if (isSearchPath || hasSearchParam) {
      setShowSearch(true);
      setQuickSearchText("");
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    let lastKeyPressTime = 0;
    const handleKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

        if (isInputFocused && !showSearch) return;


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
      if (e.code === "Escape") {
        setShowSearch(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearch]);

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
      const res = await api.get("/vocabulary", {
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

  const hasExactMatch = quickSearchResults.some(
    (item) => item.word.toLowerCase() === quickSearchText.trim().toLowerCase()
  );

  return {
    showSearch,
    setShowSearch,
    quickSearchText,
    setQuickSearchText,
    quickSearchResults,
    isSearching,
    searchInputRef,
    hasExactMatch,
    handleQuickSearchChange,
  };
};

export default useQuickSearch;