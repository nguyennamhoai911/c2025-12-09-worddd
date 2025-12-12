// apps/frontend/components/vocabulary/QuickSearchModal.tsx
import React, { useEffect, useRef } from "react";

// Định nghĩa lại interface VocabItem ở đây (hoặc import nếu bạn có file types chung)
interface VocabItem {
  id: string;
  word: string;
  meaning?: string | null;
  partOfSpeech?: string | null;
  topic?: string | null;
  isStarred?: boolean;
  occurrence?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  searchText: string;
  onSearchChange: (text: string) => void;
  results: VocabItem[];
  isSearching: boolean;
  isIframeMode: boolean; // 👇 Quan trọng để chỉnh độ mờ
  
  // Các Actions
  onSelect: (item: VocabItem) => void;
  onCreate: (text: string) => void;
  onSpeak: (text: string, e: React.MouseEvent) => void;
  onOpenAssessment: (item: VocabItem, e: React.MouseEvent) => void;
}

export default function QuickSearchModal({
  isOpen,
  onClose,
  searchText,
  onSearchChange,
  results,
  isSearching,
  isIframeMode,
  onSelect,
  onCreate,
  onSpeak,
  onOpenAssessment
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 👇 LOGIC FIX BLUR: 
  // Nếu là Iframe (Extension): Nền trong suốt hoặc rất mờ để nhìn thấy web dưới
  // Nếu là Web thường: Nền đen mờ 60%
  const overlayClass = isIframeMode
    ? "fixed inset-0 bg-black/5 z-[100] flex items-start justify-center pt-20"
    : "fixed inset-0 bg-black/60 z-[100] flex items-start justify-center pt-32 backdrop-blur-sm";

  const hasExactMatch = results.some(
    (item) => item.word.toLowerCase() === searchText.trim().toLowerCase()
  );

  return (
    <div className={overlayClass} onClick={onClose}>
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col mx-4 border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <span className="text-xl">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              results.length === 0 &&
              onCreate(searchText)
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
            <div className="p-8 text-center text-gray-400">Searching...</div>
          ) : (
            <>
              {/* Create New Button */}
              {searchText && !hasExactMatch && (
                <div
                  className="p-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center group cursor-pointer hover:bg-indigo-100 transition-colors"
                  onClick={() => onCreate(searchText)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xl">
                      +
                    </div>
                    <div>
                      <div className="font-bold text-indigo-800">
                        Create "{searchText}"
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

              {/* Results List */}
              {results.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {results.map((item) => (
                    <li
                      key={item.id}
                      onClick={() => onSelect(item)}
                      className="p-3 hover:bg-indigo-50 cursor-pointer transition-colors group"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-lg text-indigo-700">
                              {item.word}
                            </span>
                            
                            {/* Actions nhỏ trong list */}
                            <button
                              onClick={(e) => onOpenAssessment(item, e)}
                              className="text-gray-400 hover:text-green-600 p-1 rounded-full hover:bg-green-100"
                            >
                              🎤
                            </button>
                            <button
                              onClick={(e) => onSpeak(item.word, e)}
                              className="text-gray-400 hover:text-indigo-600 p-1 rounded-full hover:bg-indigo-100"
                            >
                              🔊
                            </button>
                            
                            {item.partOfSpeech && (
                              <span className="text-[10px] uppercase font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                                {item.partOfSpeech}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-800 line-clamp-2">
                            {item.meaning || <span className="italic text-gray-400">No meaning</span>}
                          </div>
                        </div>
                        
                        {/* Meta info bên phải */}
                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          {item.topic && (
                            <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {item.topic}
                            </span>
                          )}
                          {item.isStarred && <span className="text-yellow-400 text-xs">★</span>}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                !hasExactMatch &&
                searchText && (
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
  );
}