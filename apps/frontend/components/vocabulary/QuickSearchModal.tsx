import { useEffect, useState } from "react";
import axios from "axios";
import { VocabItem } from "@/hooks/vocabulary/useVocabData";

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
  const [translation, setTranslation] = useState<string>("");
  const [pronunciation, setPronunciation] = useState<string>("");
  const [partOfSpeech, setPartOfSpeech] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState(false);

  // Auto translate when search text changes and no exact match
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, searchInputRef]);

  useEffect(() => {
    const fetchTranslation = async () => {
      // Chỉ reset khi có exact match, không phụ thuộc vào results.length
      if (!searchText || hasExactMatch) {
        setTranslation("");
        setPronunciation("");
        setPartOfSpeech("");
        return;
      }

      setIsTranslating(true);
      try {
        // Fetch cả dictionary và translation như code autofill hiện tại
        const dictPromise = axios
          .get(`https://api.dictionaryapi.dev/api/v2/entries/en/${searchText}`)
          .catch(() => null);

        const translatePromise = axios
          .get(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(
              searchText
            )}`
          )
          .catch(() => null);

        const [dictRes, transRes] = await Promise.all([
          dictPromise,
          translatePromise,
        ]);

        // Xử lý dictionary data
        if (dictRes && dictRes.data && dictRes.data[0]) {
          const entry = dictRes.data[0];
          
          // Pronunciation
          if (entry.phonetic) {
            setPronunciation(entry.phonetic);
          } else if (entry.phonetics && entry.phonetics.length > 0) {
            const p = entry.phonetics.find((x: any) => x.text && x.audio);
            setPronunciation(p ? p.text : entry.phonetics[0].text || "");
          }
          
          // Part of Speech
          if (entry.meanings && entry.meanings.length > 0) {
            setPartOfSpeech(entry.meanings[0].partOfSpeech || "");
          }
        }

        // Xử lý translation
        if (transRes && transRes.data && transRes.data[0]) {
          const translatedText = transRes.data[0]
            .map((item: any) => item[0])
            .join("");
          setTranslation(translatedText);
        }
      } catch (error) {
        console.error("Translation error:", error);
        setTranslation("");
        setPronunciation("");
        setPartOfSpeech("");
      } finally {
        setIsTranslating(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchTranslation();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchText, hasExactMatch]);

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
              {/* Google Translate Preview Section - Show when no exact match */}
              {searchText && !hasExactMatch && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                  <div className="p-4 space-y-3">
                    {/* Word with pronunciation buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-2xl font-bold text-gray-800">
                        {searchText}
                      </span>
                      
                      {/* Pronunciation */}
                      {pronunciation && (
                        <span className="text-sm text-gray-600 font-mono bg-white px-2 py-1 rounded border border-gray-200">
                          {pronunciation}
                        </span>
                      )}
                      
                      {/* Part of Speech */}
                      {partOfSpeech && (
                        <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-100 border border-indigo-200 px-2 py-1 rounded">
                          {partOfSpeech}
                        </span>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSpeak(searchText, e);
                        }}
                        className="p-2 hover:bg-blue-100 rounded-full transition-colors"
                        title="Play pronunciation"
                      >
                        🔊
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAssessment({ 
                            id: 'temp', 
                            word: searchText,
                            // userId: '',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                          }, e);
                        }}
                        className="p-2 hover:bg-green-100 rounded-full transition-colors"
                        title="Test pronunciation"
                      >
                        🎤
                      </button>
                    </div>

                    {/* Translation */}
                    {isTranslating ? (
                      <div className="text-sm text-gray-500 italic animate-pulse">
                        Loading...
                      </div>
                    ) : translation ? (
                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <div className="text-xs text-gray-500 mb-1">
                          🌐 Google Translate
                        </div>
                        <div className="text-base text-gray-800 font-medium">
                          {translation}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

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
                searchText && !translation && !isTranslating && (
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