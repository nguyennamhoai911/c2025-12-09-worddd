import React from "react";
import { StarIcon, MicrophoneIcon, SpeakerIcon } from "@/components/Icons";

interface Props {
  vocabs: any[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  // Sorting & Filtering
  filters: any;
  onFilterChange: (key: string, value: string) => void;
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  // Drag Drop
  columnOrder: string[];
  onDragStart: (e: any, col: string) => void;
  onDragOver: (e: any, col: string) => void;
  onDragEnd: () => void;
  draggedCol: string | null;
  // Actions
  onRowClick: (item: any) => void;
  onToggleStar: (id: string, status: boolean, e: any) => void;
  onSpeak: (text: string, e: any) => void; // 👈 Reverted to text: string
  onOpenAssessment: (item: any, e: any) => void;
}

export default function VocabTable({
  vocabs, loading, page, totalPages, onPageChange,
  filters, onFilterChange, onSort, sortConfig,
  columnOrder, onDragStart, onDragOver, onDragEnd, draggedCol,
  onRowClick, onToggleStar, onSpeak, onOpenAssessment
}: Props) {

  // --- COLUMN CONFIG ---
  const getSortIcon = (colKey: string) =>
    sortConfig.key !== colKey ? <span className="text-gray-300 ml-1 opacity-50">↕</span> 
    : sortConfig.direction === "asc" ? <span className="ml-1 text-indigo-600">▲</span> 
    : <span className="ml-1 text-indigo-600">▼</span>;

  const columnConfig: any = {
    star: { 
      label: "★", width: "w-12", sortKey: "isStarred", 
      renderCell: (v: any) => <button onClick={(e) => onToggleStar(v.id, v.isStarred, e)} className="hover:bg-gray-100 rounded-full p-1"><StarIcon filled={v.isStarred} className={v.isStarred ? "text-yellow-400 w-5 h-5" : "text-gray-300 w-5 h-5"} /></button> 
    },
    updatedAt: { 
      label: "Last Active", width: "w-32", sortKey: "updatedAt", 
      renderCell: (v: any) => <div className="font-mono text-xs text-gray-500">{new Date(v.updatedAt).toLocaleDateString()}<br />{new Date(v.updatedAt).toLocaleTimeString()}</div> 
    },
    topic: { 
      label: "Topic", width: "w-32", sortKey: "topic", 
      renderCell: (v: any) => v.topic && <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{v.topic}</span>, 
      renderFilter: () => <input className="w-full border rounded px-2 py-1 text-xs outline-none" placeholder="Filter..." value={filters.topic} onChange={(e) => onFilterChange("topic", e.target.value)} /> 
    },
    word: { 
      label: "Word", width: "w-48", sortKey: "word", 
      renderCell: (v: any) => (
        <div className="flex items-center justify-between gap-2 font-bold text-indigo-700">
          <span>{v.word}</span>
          <div className="flex items-center gap-1">
            <button onClick={(e) => onOpenAssessment(v, e)} className="text-gray-400 hover:text-green-600 p-1 rounded-full hover:bg-green-50"><MicrophoneIcon className="w-4 h-4" /></button>
            <button onClick={(e) => onSpeak(v.word, e)} className="text-gray-400 hover:text-indigo-600 p-1 rounded-full hover:bg-indigo-50"><SpeakerIcon className="w-4 h-4" /></button>
          </div>
        </div>
      ), 
      renderFilter: () => <input className="w-full border rounded px-2 py-1 text-xs outline-none" placeholder="Filter..." value={filters.word} onChange={(e) => onFilterChange("word", e.target.value)} /> 
    },
    pronunciation: { label: "Pronun.", width: "w-32", renderCell: (v: any) => <span className="font-mono text-gray-500 text-xs">{v.pronunciation}</span> },
    meaning: { 
      label: "Meaning", width: "w-48", 
      renderCell: (v: any) => <span className="text-gray-800 text-sm line-clamp-2" title={v.meaning}>{v.meaning}</span>, 
      renderFilter: () => <input className="w-full border rounded px-2 py-1 text-xs outline-none" placeholder="Meaning..." value={filters.meaning} onChange={(e) => onFilterChange("meaning", e.target.value)} /> 
    },
    example: { label: "Example", width: "w-64", renderCell: (v: any) => <span className="italic text-gray-500 text-xs line-clamp-2" title={v.example}>{v.example}</span> },
    relatedWords: { label: "Related", width: "w-40", renderCell: (v: any) => <span className="text-gray-500 text-xs">{v.relatedWords}</span> },
    occurrence: { label: "Count", width: "w-20", sortKey: "occurrence", renderCell: (v: any) => <div className="text-center font-semibold text-gray-500">{v.occurrence}</div> },
    score: { 
      label: "Score", width: "w-20", 
      renderCell: (v: any) => {
        const scores = v.pronunciationScores || [];
        if (scores.length === 0) return <span className="text-gray-300 text-xs">-</span>;
        const avg = Math.round(scores.slice(-3).reduce((a:number, b:number) => a + b, 0) / scores.slice(-3).length);
        const color = avg >= 80 ? "bg-green-100 text-green-700" : avg >= 60 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";
        return <div className="flex flex-col items-center"><span className={`text-xs font-bold px-2 py-0.5 rounded ${color}`}>{avg}</span></div>;
      }
    },
    actions: { 
      label: "Action", width: "w-20", 
      renderCell: (v: any) => <button onClick={(e) => { e.stopPropagation(); onRowClick(v); }} className="text-indigo-600 text-xs border border-indigo-200 px-2 py-1 rounded hover:bg-indigo-50">Edit</button> 
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      <div className="overflow-x-auto pb-4">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50 select-none">
            <tr>
              {columnOrder.map((colId) => {
                const config = columnConfig[colId];
                if (!config) return null;
                return (
                  <th key={colId} draggable onDragStart={(e) => onDragStart(e, colId)} onDragOver={(e) => onDragOver(e, colId)} onDragEnd={onDragEnd}
                    onClick={() => config.sortKey && onSort(config.sortKey)}
                    className={`${config.width} px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase border-r border-gray-200 cursor-move hover:bg-gray-100 ${draggedCol === colId ? "opacity-50 bg-indigo-50" : ""} ${colId === "actions" ? "sticky right-0 bg-gray-50 z-10" : ""}`}
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
              {columnOrder.map((colId) => (
                <td key={colId} className={`p-2 border-r border-gray-100 ${colId === "actions" ? "sticky right-0 bg-white z-10" : ""}`}>
                  {columnConfig[colId]?.renderFilter ? columnConfig[colId].renderFilter() : null}
                </td>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? <tr><td colSpan={columnOrder.length} className="text-center py-10 text-gray-500">Loading...</td></tr> 
            : vocabs.length === 0 ? <tr><td colSpan={columnOrder.length} className="text-center py-10 text-gray-500">No vocabulary found.</td></tr>
            : vocabs.map((vocab) => (
              <tr key={vocab.id} className="hover:bg-indigo-50/50 group transition-colors cursor-pointer" onClick={() => onRowClick(vocab)}>
                {columnOrder.map((colId) => (
                  <td key={colId} className={`px-4 py-3 text-sm border-r border-gray-100 align-top whitespace-normal break-words ${colId === "actions" ? "sticky right-0 bg-white group-hover:bg-indigo-50/50 z-10" : ""}`} onClick={colId === "actions" || colId === "star" ? (e) => e.stopPropagation() : undefined}>
                    {columnConfig[colId]?.renderCell(vocab)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center sticky bottom-0 z-20">
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="px-4 py-2 bg-white border rounded shadow-sm hover:bg-gray-100 disabled:opacity-50 text-sm font-medium">← Previous</button>
        <span className="text-sm font-medium text-gray-600">Page <span className="text-indigo-600 font-bold">{page}</span> of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="px-4 py-2 bg-white border rounded shadow-sm hover:bg-gray-100 disabled:opacity-50 text-sm font-medium">Next →</button>
      </div>
    </div>
  );
}