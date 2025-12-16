"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

import useVocabData from "@/hooks/vocabulary/useVocabData";
import useVocabModals from "@/hooks/vocabulary/useVocabModals";

import usePronunciationAssessment from "@/hooks/vocabulary/usePronunciationAssessment";
import useQuickSearch from "@/hooks/vocabulary/useQuickSearch";

import VocabTable from "@/components/vocabulary/VocabTable";
import VocabFormModal from "@/components/vocabulary/VocabFormModal";
import AssessmentModal from "@/components/vocabulary/AssessmentModal";
import QuickSearchModal from "@/components/vocabulary/QuickSearchModal";
import { StarIcon } from "@/components/Icons";

export default function VocabularyPage() {
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check if in iframe mode
  const isIframeMode = searchParams.get("iframeMode") === "true";

  // QUAN TRỌNG: Gọi TẤT CẢ hooks TRƯỚC khi có bất kỳ return nào
  const {
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
  } = useVocabData(token);

  const {
    selectedVocab,
    isModalOpen,
    setIsModalOpen,
    isAutoFilling,
    formData,
    setFormData,
    fileInputRef,
    isUploading,
    handleRowClick,
    handleOpenCreateModal,
    handleSave,
    handleDelete,
    handleFileChange,
    fetchAutoFillData,
  } = useVocabModals(token, () => fetchVocabs(page));

  const {
    isAssessmentModalOpen,
    setIsAssessmentModalOpen,
    recordingVocabItem,
    isRecording,
    assessmentResult,
    assessmentError,
    isProcessingAudio,
    userAudioUrl,
    startRecording,
    stopRecording,
    handleOpenAssessment,
    handleSpeak,
  } = usePronunciationAssessment(token, () => fetchVocabs(page), page);

  const {
    showSearch,
    setShowSearch,
    quickSearchText,
    quickSearchResults,
    isSearching,
    searchInputRef,
    hasExactMatch,
    handleQuickSearchChange,
  } = useQuickSearch(token, handleOpenCreateModal);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        // Nếu đang trong iframe mode, gửi message để đóng
        if (isIframeMode) {
          window.parent.postMessage("CLOSE_EXTENSION_IFRAME", "*");
        }
        setShowSearch(false);
        setIsModalOpen(false);
        setIsAssessmentModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsAssessmentModalOpen, setIsModalOpen, setShowSearch, isIframeMode]);

  // Redirect to login if not authenticated (AFTER all hooks)
  useEffect(() => {
    if (!isLoading && !token) {
      router.push("/login");
    }
  }, [token, isLoading, router]);

  // Hiển thị loading khi đang check auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Nếu không có token sau khi load xong, đừng render gì (đang redirect)
  if (!token) {
    return null;
  }

  return (
    <div className={`min-h-screen ${isIframeMode ? 'bg-transparent' : 'bg-gray-50'} p-6 text-black relative`}>
      <AssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        vocabItem={recordingVocabItem}
        isRecording={isRecording}
        assessmentResult={assessmentResult}
        assessmentError={assessmentError}
        isProcessingAudio={isProcessingAudio}
        userAudioUrl={userAudioUrl}
        startRecording={startRecording}
        stopRecording={stopRecording}
        handleSpeak={handleSpeak}
      />

      <QuickSearchModal
        isOpen={showSearch}
        onClose={() => {
          setShowSearch(false);
          // Nếu đang trong iframe mode và đóng search, thì đóng cả iframe
          if (isIframeMode) {
            window.parent.postMessage("CLOSE_EXTENSION_IFRAME", "*");
          }
        }}
        searchText={quickSearchText}
        onSearchChange={handleQuickSearchChange}
        results={quickSearchResults}
        isSearching={isSearching}
        onSelect={(vocab) => {
          setShowSearch(false);
          handleRowClick(vocab);
        }}
        onCreate={() => handleOpenCreateModal(quickSearchText)}
        hasExactMatch={hasExactMatch}
        searchInputRef={searchInputRef as React.RefObject<HTMLInputElement>}
        handleSpeak={handleSpeak}
        handleOpenAssessment={handleOpenAssessment}
        triggerInteraction={triggerInteraction}
      />

      <VocabFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={formData}
        setInitialData={setFormData}
        isEditMode={!!selectedVocab}
        onSave={handleSave}
        onDelete={() => selectedVocab && handleDelete(selectedVocab.id)}
        isAutoFilling={isAutoFilling}
        fetchAutoFillData={fetchAutoFillData}
        handleOpenAssessment={handleOpenAssessment}
        handleSpeak={handleSpeak}
        selectedVocab={selectedVocab}
      />

      {/* CHẠY TRONG IFRAME MODE: Chỉ hiện QuickSearchModal, ẩn hết phần còn lại */}
      {isIframeMode ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-400 text-sm">
            {/* Placeholder - QuickSearchModal sẽ tự động mở */}
          </div>
        </div>
      ) : (
        <>
          {/* PAGE HEADER - CHỈ HIỆN KHI KHÔNG PHẢI IFRAME MODE */}
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

          <VocabTable
            vocabs={vocabs}
            loading={loading}
            columnOrder={columnOrder}
            draggedCol={draggedCol}
            sortConfig={sortConfig}
            filters={filters}
            page={page}
            totalPages={totalPages}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDragEnd={handleDragEnd}
            handleSort={handleSort}
            handleFilterChange={handleFilterChange}
            handleRowClick={handleRowClick}
            handleToggleStar={handleToggleStar}
            handleOpenAssessment={handleOpenAssessment}
            handleSpeak={handleSpeak}
            triggerInteraction={triggerInteraction}
            fetchVocabs={fetchVocabs}
            setPage={setPage}
          />
        </>
      )}
    </div>
  );
}