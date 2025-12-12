
import React from "react";
import {
  VocabItem,
  FilterState,
  SortState,
} from "@/hooks/vocabulary/useVocabData";
import { StarIcon, MicrophoneIcon, SpeakerIcon } from "@/components/Icons";

interface Props {
  vocabs: VocabItem[];
  loading: boolean;
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  fetchVocabs: (
    pageNum?: number,
    filters?: FilterState,
    sort?: SortState
  ) => void;
  filters: FilterState;
  handleFilterChange: (key: keyof FilterState, value: string) => void;
  handleSort: (key: string) => void;
  sortConfig: SortState;
  columnOrder: string[];
  handleDragStart: (e: React.DragEvent, col: string) => void;
  handleDragOver: (e: React.DragEvent, col: string) => void;
  handleDragEnd: () => void;
  draggedCol: string | null;
  handleRowClick: (item: VocabItem) => void;
  handleToggleStar: (id: string, status: boolean, e: React.MouseEvent) => void;
  handleSpeak: (text: string, e: React.MouseEvent) => void;
  handleOpenAssessment: (item: VocabItem, e: React.MouseEvent) => void;
  triggerInteraction: (vocab: VocabItem) => void;
}

export default function VocabTable({
  vocabs,
  loading,
  page,
  totalPages,
  setPage,
  fetchVocabs,
  filters,
  handleFilterChange,
  handleSort,
  sortConfig,
  columnOrder,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  draggedCol,
  handleRowClick,
  handleToggleStar,
  handleSpeak,
  handleOpenAssessment,
  triggerInteraction,
}: Props) {
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchVocabs(newPage, filters, sortConfig);
  };

  const getSortIcon = (colKey: string) =>
    sortConfig.key !== colKey ? (
      <span className="text-gray-300 ml-1 opacity-50">↕</span>
    ) : sortConfig.direction === "asc" ? (
      <span className="ml-1 text-indigo-600">▲</span>
    ) : (
      <span className="ml-1 text-indigo-600">▼</span>
    );

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

  return (
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
                    onClick={() => config.sortKey && handleSort(config.sortKey)}
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
          onClick={() => handlePageChange(page - 1)}
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
          onClick={() => handlePageChange(page + 1)}
          className="px-4 py-2 bg-white border rounded shadow-sm hover:bg-gray-100 disabled:opacity-50 text-sm font-medium"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
