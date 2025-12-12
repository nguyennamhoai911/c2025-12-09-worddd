// apps/frontend/components/vocabulary/QuickSearchModal.tsx
import React, { useEffect, useRef } from "react";

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
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  results: VocabItem[];
  isSearching: boolean;
  
  // Các Actions
  onSelect: (item: VocabItem) => void;
  onCreate: () => void;
  hasExactMatch: boolean;
  searchInputRef: React.RefObject<HTMLInputElement>;
  handleSpeak: (text: string, e?: React.MouseEvent) => void;
  handleOpenAssessment: (item: VocabItem, e?: React.MouseEvent) => void;
  triggerInteraction: (item: VocabItem) => void;
}

export default function QuickSearchModal({
  isOpen,
  onClose,
  searchText,
  onSearchChange,
  results,
  isSearching,
  onSelect,
  onCreate,
  hasExactMatch,
  searchInputRef,
  handleSpeak,
  handleOpenAssessment,
  triggerInteraction
}: Props) {
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, searchInputRef]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-start justify-center pt-20"
      onClick={onClose}
      style={{ backgroundColor: 'transparent' }}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col mx-4 border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <span className="text-xl">🔍</span>
          <input
            ref={searchInputRef}
            type="text"
            value={searchText}
            onChange={onSearchChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results.length === 0 && !hasExactMatch) {
                onCreate();
              }
            }}
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
                  onClick={onCreate}
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
                      onClick={() => {
                        triggerInteraction(item);
                        onSelect(item);
                      }}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAssessment(item, e);
                              }}
                              className="text-gray-400 hover:text-green-600 p-1 rounded-full hover:bg-green-100"
                            >
                              🎤
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSpeak(item.word, e);
                              }}
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