'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

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
  createdAt: string;
}

interface FilterState {
  word: string;
  topic: string;
  partOfSpeech: string;
  meaning: string;
}

interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

export default function VocabularyPage() {
  const { token } = useAuth();

  // --- STATES ---
  const [vocabs, setVocabs] = useState<VocabItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    word: '', topic: '', partOfSpeech: '', meaning: ''
  });

  const [sortConfig, setSortConfig] = useState<SortState>({
    key: 'createdAt',
    direction: 'desc'
  });

  // --- QUICK SEARCH STATES ---
  const [showSearch, setShowSearch] = useState(false);
  const [quickSearchText, setQuickSearchText] = useState('');
  const [quickSearchResults, setQuickSearchResults] = useState<VocabItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const quickSearchDebounce = useRef<NodeJS.Timeout | null>(null);

  const [selectedVocab, setSelectedVocab] = useState<VocabItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // --- FETCH DATA ---
  const fetchVocabs = useCallback(async (
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
        sortOrder: currentSort.direction
      };

      if (starred) {
        params.isStarred = 'true';
      }

      const res = await axios.get('http://localhost:5000/vocabulary', {
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
  }, [token, filters, sortConfig, showStarredOnly]);

  useEffect(() => {
    fetchVocabs();
  }, [fetchVocabs]);

  // --- HANDLERS ---
  const handleToggleStar = async (id: string, currentStatus: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Optimistic Update
    const toggleFunc = (list: VocabItem[]) =>
      list.map(item => item.id === id ? { ...item, isStarred: !currentStatus } : item);

    setVocabs(toggleFunc);
    setQuickSearchResults(toggleFunc);
    if (selectedVocab && selectedVocab.id === id) {
      setSelectedVocab({ ...selectedVocab, isStarred: !currentStatus });
    }

    try {
      await axios.patch(`http://localhost:5000/vocabulary/${id}`,
        { isStarred: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Failed to star", error);
      alert("Failed to update star");
    }
  };

  const performQuickSearch = async (text: string) => {
    if (!token || !text.trim()) {
      setQuickSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await axios.get('http://localhost:5000/vocabulary', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: 1, limit: 5, search: text, sortBy: 'word', sortOrder: 'asc'
        }
      });
      setQuickSearchResults(res.data.data);
    } catch (error) {
      console.error("Quick search error", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setQuickSearchText(text);

    if (quickSearchDebounce.current) clearTimeout(quickSearchDebounce.current);
    quickSearchDebounce.current = setTimeout(() => {
      performQuickSearch(text);
    }, 300);
  };

  const handleQuickCreate = async () => {
    if (!quickSearchText || !token) return;
    try {
      const res = await axios.post('http://localhost:5000/vocabulary',
        { word: quickSearchText, isStarred: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Created "${quickSearchText}"`);
      setShowSearch(false);
      setQuickSearchText('');
      fetchVocabs(1);
      setSelectedVocab(res.data);
    } catch (e) { alert("Error creating word"); }
  };

  useEffect(() => {
    let lastKeyPressTime = 0;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' && !showSearch) return;

      if (e.code === 'Space') {
        const currentTime = new Date().getTime();
        if (currentTime - lastKeyPressTime < 300) {
          e.preventDefault();
          setShowSearch(true);
          setQuickSearchText('');
          setQuickSearchResults([]);
          setTimeout(() => searchInputRef.current?.focus(), 100);
        }
        lastKeyPressTime = currentTime;
      }
      if (e.code === 'Escape') {
        setShowSearch(false);
        setSelectedVocab(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    const newSort: SortState = { key, direction };
    setSortConfig(newSort);
    fetchVocabs(1, filters, newSort);
  };

  const getSortIcon = (colKey: string) => {
    if (sortConfig.key !== colKey) return <span className="text-gray-300 ml-1">↕</span>;
    return sortConfig.direction === 'asc' ? <span className="ml-1 text-indigo-600">▲</span> : <span className="ml-1 text-indigo-600">▼</span>;
  };

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchVocabs(1, newFilters, sortConfig), 500);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this word?")) return;
    try {
      await axios.delete(`http://localhost:5000/vocabulary/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchVocabs(page, filters, sortConfig);
      if (selectedVocab?.id === id) setSelectedVocab(null);
    } catch (e) { alert("Failed"); }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setIsUploading(true);
      await axios.post('http://localhost:5000/vocabulary/import/csv', formData, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      alert('Import success!');
      fetchVocabs(1);
    } catch (error) { alert('Import failed!'); }
    finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black relative">

      {/* QUICK SEARCH MODAL */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-32 backdrop-blur-sm transition-all" onClick={() => setShowSearch(false)}>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <span className="text-xl">🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                value={quickSearchText}
                onChange={handleQuickSearchChange}
                onKeyDown={(e) => e.key === 'Enter' && quickSearchResults.length === 0 && handleQuickCreate()}
                placeholder="Search English or Vietnamese..."
                className="flex-1 text-xl font-light outline-none bg-transparent placeholder-gray-400 text-gray-800 h-10"
              />
              <div className="text-xs text-gray-400 border border-gray-200 px-2 py-1 rounded">ESC to close</div>
            </div>
            <div className="bg-gray-50 max-h-[60vh] overflow-y-auto">
              {isSearching ? (
                <div className="p-8 text-center text-gray-400">Searching...</div>
              ) : quickSearchText && quickSearchResults.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500 mb-4">No matching vocabulary found for "<span className="font-bold text-gray-800">{quickSearchText}</span>"</p>
                  <button
                    onClick={handleQuickCreate}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-full hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2 mx-auto font-medium"
                  >
                    <span>+</span> Create new word "{quickSearchText}"
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {quickSearchResults.map(item => (
                    <li
                      key={item.id}
                      onClick={() => {
                        setSelectedVocab(item);
                        setShowSearch(false);
                      }}
                      className="p-4 hover:bg-indigo-50 cursor-pointer transition-colors flex justify-between items-center group"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => handleToggleStar(item.id, item.isStarred, e)}
                          className="focus:outline-none"
                        >
                          <StarIcon filled={item.isStarred} className={item.isStarred ? "text-yellow-400" : "text-gray-300"} />
                        </button>
                        <div>
                          <div className="font-bold text-lg text-gray-800">{item.word}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">{item.meaning || <span className="italic opacity-50">No meaning</span>}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 group-hover:text-indigo-500 px-2 py-1 border border-transparent group-hover:border-indigo-200 rounded">
                        View detail ↵
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DETAIL POPUP */}
      {selectedVocab && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedVocab(null)}>
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="bg-indigo-600 p-6 text-white relative">
              <button onClick={() => setSelectedVocab(null)} className="absolute top-4 right-4 text-white/70 hover:text-white text-xl font-bold">✕</button>
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm uppercase tracking-wider opacity-80 mb-1">{selectedVocab.partOfSpeech || 'Vocabulary'}</div>
                  <h2 className="text-4xl font-bold">{selectedVocab.word}</h2>
                  <div className="mt-2 font-mono bg-indigo-700/50 inline-block px-2 py-0.5 rounded text-sm">{selectedVocab.pronunciation || '/.../'}</div>
                </div>
                <button
                  onClick={() => handleToggleStar(selectedVocab.id, selectedVocab.isStarred)}
                  className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                >
                  <StarIcon filled={selectedVocab.isStarred} className="text-yellow-400 w-8 h-8" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Meaning</label>
                <div className="text-lg text-gray-800 font-medium border-l-4 border-indigo-500 pl-3">
                  {selectedVocab.meaning || 'N/A'}
                </div>
              </div>
              {selectedVocab.example && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Example</label>
                  <div className="text-gray-600 italic bg-gray-50 p-3 rounded-lg">"{selectedVocab.example}"</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Topic</label>
                  <div className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded inline-block">{selectedVocab.topic || 'General'}</div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Related Words</label>
                  <div className="text-sm text-gray-700">{selectedVocab.relatedWords || '-'}</div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Occurrence</label>
                  <div className="text-sm text-gray-700">{selectedVocab.occurrence} times</div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Created At</label>
                  <div className="text-sm text-gray-700">{new Date(selectedVocab.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => handleDelete(selectedVocab.id)}
                className="text-red-600 hover:bg-red-50 px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedVocab(null)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Vocabulary</h1>
          <p className="text-gray-500 text-sm mt-1">
            Press <kbd className="bg-gray-200 px-1.5 py-0.5 rounded text-xs border border-gray-300">Space</kbd> <kbd className="bg-gray-200 px-1.5 py-0.5 rounded text-xs border border-gray-300">Space</kbd> to Quick Search
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <button
            onClick={() => {
              const newValue = !showStarredOnly;
              setShowStarredOnly(newValue);
              fetchVocabs(1, filters, sortConfig, newValue);
            }}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${showStarredOnly
              ? 'bg-yellow-50 border-yellow-400 text-yellow-700'
              : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
          >
            <StarIcon filled={showStarredOnly} className={showStarredOnly ? "text-yellow-500" : "text-gray-400"} />
            <span className="text-sm font-medium">{showStarredOnly ? 'Starred Only' : 'All Words'}</span>
          </button>

          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 transition-colors text-sm font-medium"
          >
            {isUploading ? 'Importing...' : '📂 Import CSV'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto pb-4">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50 select-none">
              <tr>
                <th className="w-12 px-2 py-3 text-center text-xs font-bold text-gray-500 uppercase border-r border-gray-200">★</th>
                <th onClick={() => handleSort('createdAt')} className="w-32 px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 border-r border-gray-200 transition-colors">Time {getSortIcon('createdAt')}</th>
                <th onClick={() => handleSort('topic')} className="w-32 px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 border-r border-gray-200 transition-colors">Topic {getSortIcon('topic')}</th>
                <th onClick={() => handleSort('word')} className="w-40 px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 border-r border-gray-200 transition-colors">Word {getSortIcon('word')}</th>
                <th className="w-24 px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase border-r border-gray-200">Type</th>
                <th className="w-32 px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase border-r border-gray-200">Pronun.</th>
                <th className="w-48 px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase border-r border-gray-200">Meaning</th>
                <th className="w-64 px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase border-r border-gray-200">Example</th>
                <th className="w-48 px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase border-r border-gray-200">Related</th>
                <th onClick={() => handleSort('occurrence')} className="w-20 px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 border-r border-gray-200 transition-colors">Count {getSortIcon('occurrence')}</th>
                <th className="w-24 px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase sticky right-0 bg-gray-50 shadow-l z-10">Actions</th>
              </tr>
              <tr className="bg-white border-b border-gray-200">
                <td className="p-2 border-r border-gray-100"></td>
                <td className="p-2 border-r border-gray-100"></td>
                <td className="p-2 border-r border-gray-100"><input className="w-full border rounded px-2 py-1 text-xs focus:border-indigo-500 outline-none" placeholder="Filter..." value={filters.topic} onChange={(e) => handleFilterChange('topic', e.target.value)} /></td>
                <td className="p-2 border-r border-gray-100"><input className="w-full border rounded px-2 py-1 text-xs focus:border-indigo-500 outline-none" placeholder="Filter..." value={filters.word} onChange={(e) => handleFilterChange('word', e.target.value)} /></td>
                <td className="p-2 border-r border-gray-100"><input className="w-full border rounded px-2 py-1 text-xs focus:border-indigo-500 outline-none" placeholder="Type..." value={filters.partOfSpeech} onChange={(e) => handleFilterChange('partOfSpeech', e.target.value)} /></td>
                <td className="p-2 border-r border-gray-100"></td>
                <td className="p-2 border-r border-gray-100"><input className="w-full border rounded px-2 py-1 text-xs focus:border-indigo-500 outline-none" placeholder="Meaning..." value={filters.meaning} onChange={(e) => handleFilterChange('meaning', e.target.value)} /></td>
                <td className="p-2 border-r border-gray-100"></td>
                <td className="p-2 border-r border-gray-100"></td>
                <td className="p-2 border-r border-gray-100"></td>
                <td className="p-2 sticky right-0 bg-white z-10"></td>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={11} className="text-center py-10 text-gray-500">Loading data...</td></tr>
              ) : vocabs.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-10 text-gray-500">No vocabulary found.</td></tr>
              ) : (
                vocabs.map((vocab) => (
                  <tr
                    key={vocab.id}
                    className="hover:bg-indigo-50/30 group transition-colors cursor-pointer"
                    onClick={() => setSelectedVocab(vocab)}
                  >
                    <td className="px-2 py-3 text-center border-r border-gray-100 align-top" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => handleToggleStar(vocab.id, vocab.isStarred, e)} className="hover:bg-gray-100 rounded-full p-1">
                        <StarIcon filled={vocab.isStarred} className={vocab.isStarred ? "text-yellow-400 w-5 h-5" : "text-gray-300 w-5 h-5"} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-normal break-words border-r border-gray-100 align-top">{new Date(vocab.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-normal break-words border-r border-gray-100 align-top">{vocab.topic && <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{vocab.topic}</span>}</td>
                    <td className="px-4 py-3 text-sm font-bold text-indigo-700 whitespace-normal break-words border-r border-gray-100 align-top">{vocab.word}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-normal break-words border-r border-gray-100 align-top italic">{vocab.partOfSpeech}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-500 whitespace-normal break-words border-r border-gray-100 align-top">{vocab.pronunciation}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 whitespace-normal break-words border-r border-gray-100 align-top">{vocab.meaning}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-normal break-words border-r border-gray-100 align-top italic">{vocab.example}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-normal break-words border-r border-gray-100 align-top">{vocab.relatedWords}</td>
                    <td className="px-4 py-3 text-sm text-center font-semibold text-gray-500 border-r border-gray-100 align-top">{vocab.occurrence}</td>
                    <td className="px-2 py-3 text-center align-top sticky right-0 bg-white group-hover:bg-indigo-50/30 shadow-l z-10 border-l border-gray-200" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-2 items-center">
                        <button onClick={() => alert("Edit: " + vocab.word)} className="text-blue-600 hover:text-blue-800 text-xs border border-blue-200 px-2 py-1 rounded hover:bg-blue-50 w-full">Edit</button>
                        <button onClick={() => handleDelete(vocab.id)} className="text-red-600 hover:text-red-800 text-xs border border-red-200 px-2 py-1 rounded hover:bg-red-50 w-full">Del</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center sticky bottom-0 z-20">
          <button disabled={page <= 1} onClick={() => { const newPage = page - 1; setPage(newPage); fetchVocabs(newPage, filters, sortConfig); }} className="px-4 py-2 bg-white border rounded shadow-sm hover:bg-gray-100 disabled:opacity-50 text-sm font-medium">← Previous</button>
          <span className="text-sm font-medium text-gray-600">Page <span className="text-indigo-600 font-bold">{page}</span> of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => { const newPage = page + 1; setPage(newPage); fetchVocabs(newPage, filters, sortConfig); }} className="px-4 py-2 bg-white border rounded shadow-sm hover:bg-gray-100 disabled:opacity-50 text-sm font-medium">Next →</button>
        </div>
      </div>
    </div>
  );
}

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
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