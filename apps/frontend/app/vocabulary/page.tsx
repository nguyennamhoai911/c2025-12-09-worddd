"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";

interface Vocabulary {
  id: string;
  word: string;
  meaning?: string;
  context?: string;
  masteryLevel: number;
  tags: string[];
  createdAt: string;
}

export default function VocabularyPage() {
  const { user, token, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Refs & States cho tính năng Import
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [vocabs, setVocabs] = useState<Vocabulary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    word: "",
    meaning: "",
    context: "",
    masteryLevel: 0,
    tags: [] as string[],
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch vocabularies
  useEffect(() => {
    if (token) {
      fetchVocabs();
    }
  }, [token]);

  const fetchVocabs = async () => {
    try {
      setError("");
      const response = await fetch("http://localhost:5000/vocabulary", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setVocabs(data);
      } else {
        console.error("Invalid data format:", data);
        setVocabs([]);
        setError("Invalid data format from server");
      }
    } catch (err: any) {
      console.error("Error fetching:", err);
      setError(err.message || "Failed to load vocabulary");
      setVocabs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- START: IMPORT CSV LOGIC ---
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!token) {
      alert("Please login first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);
      setError("");
      
      // Dùng fetch thay vì axios để đồng bộ với code cũ
      const response = await fetch("http://localhost:5000/vocabulary/import/csv", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Lưu ý: Không set Content-Type thủ công khi dùng FormData với fetch,
          // browser sẽ tự động set boundary.
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Import failed");
      }

      alert(`Import Success! Inserted: ${result.success}, Failed: ${result.failed}`);
      
      // Refresh list thay vì reload trang
      await fetchVocabs();
      
    } catch (err: any) {
      console.error("Import error:", err);
      setError(err.message || "Failed to import CSV");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  // --- END: IMPORT CSV LOGIC ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const url = editingId
      ? `http://localhost:5000/vocabulary/${editingId}`
      : "http://localhost:5000/vocabulary";

    const method = editingId ? "PATCH" : "POST";

    try {
      console.log("Submitting:", { url, method, formData, token });

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      await fetchVocabs();
      resetForm();
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err.message || "Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this word?")) return;

    try {
      const response = await fetch(`http://localhost:5000/vocabulary/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      await fetchVocabs();
    } catch (err: any) {
      setError(err.message || "Failed to delete");
    }
  };

  const handleEdit = (vocab: Vocabulary) => {
    setFormData({
      word: vocab.word,
      meaning: vocab.meaning || "",
      context: vocab.context || "",
      masteryLevel: vocab.masteryLevel,
      tags: vocab.tags,
    });
    setEditingId(vocab.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      word: "",
      meaning: "",
      context: "",
      masteryLevel: 0,
      tags: [],
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Loading your vocabulary...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user || !token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Vocabulary
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full">
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt={user.name || ""}
                  className="w-8 h-8 rounded-full ring-2 ring-blue-500"
                />
              )}
              <span className="text-sm font-medium text-gray-700">
                {user.name}
              </span>
            </div>
            <button
              onClick={logout}
              className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 lg:px-8 py-8 max-w-6xl">
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg mb-6 flex items-start gap-3 shadow-sm">
            <span className="text-xl">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Stats and Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-200">
              <div className="text-sm text-gray-500">Total Words</div>
              <div className="text-2xl font-bold text-gray-800">
                {vocabs.length}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 px-6 py-3 rounded-xl shadow-md text-white">
              <div className="text-sm opacity-90">Mastered</div>
              <div className="text-2xl font-bold">
                {vocabs.filter((v) => v.masteryLevel === 5).length}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Input file ẩn */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            
            {/* Nút Import CSV */}
            <button
              onClick={handleImportClick}
              disabled={isUploading}
              className={`px-6 py-3 rounded-xl font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2 ${
                isUploading
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
              }`}
            >
              {isUploading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Importing...
                </>
              ) : (
                <>📂 Import CSV</>
              )}
            </button>

            {/* Nút Add New Word */}
            <button
              onClick={() => setShowForm(!showForm)}
              className={`px-6 py-3 rounded-xl font-medium transition-all shadow-md hover:shadow-lg ${
                showForm
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
              }`}
            >
              {showForm ? "✕ Cancel" : "+ Add New Word"}
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white p-8 rounded-2xl shadow-lg mb-8 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-2xl">{editingId ? "✏️" : "➕"}</span>
              {editingId ? "Edit Word" : "Add New Word"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Word <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter word"
                    value={formData.word}
                    onChange={(e) =>
                      setFormData({ ...formData, word: e.target.value })
                    }
                    required
                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meaning
                  </label>
                  <input
                    type="text"
                    placeholder="Enter meaning"
                    value={formData.meaning}
                    onChange={(e) =>
                      setFormData({ ...formData, meaning: e.target.value })
                    }
                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Context / Example
                  </label>
                  <textarea
                    placeholder="Enter a sentence or context"
                    value={formData.context}
                    onChange={(e) =>
                      setFormData({ ...formData, context: e.target.value })
                    }
                    rows={3}
                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mastery Level
                  </label>
                  <select
                    value={formData.masteryLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        masteryLevel: +e.target.value,
                      })
                    }
                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white"
                  >
                    <option value={0}>⭐ Level 0 - New</option>
                    <option value={1}>⭐ Level 1</option>
                    <option value={2}>⭐⭐ Level 2</option>
                    <option value={3}>⭐⭐⭐ Level 3</option>
                    <option value={4}>⭐⭐⭐⭐ Level 4</option>
                    <option value={5}>⭐⭐⭐⭐⭐ Level 5 - Mastered</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                >
                  {editingId ? "✓ Update Word" : "✓ Save Word"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 rounded-xl font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        <div className="grid gap-6">
          {!Array.isArray(vocabs) ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
              <span className="text-6xl mb-4 block">⚠️</span>
              <p className="text-red-500 font-medium">
                Error: Invalid data format
              </p>
            </div>
          ) : vocabs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
              <span className="text-6xl mb-4 block">📚</span>
              <p className="text-gray-500 text-lg mb-2">No vocabulary yet</p>
              <p className="text-gray-400">
                Click "Add New Word" or "Import CSV" to start building your collection!
              </p>
            </div>
          ) : (
            vocabs.map((vocab) => (
              <div
                key={vocab.id}
                className="bg-white border-2 border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:border-blue-200 transition-all group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                      {vocab.word}
                    </h3>
                    {vocab.meaning && (
                      <div className="flex items-start gap-2 mb-3">
                        <span className="text-blue-500 mt-1">📝</span>
                        <p className="text-gray-700 leading-relaxed">
                          {vocab.meaning}
                        </p>
                      </div>
                    )}
                    {vocab.context && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl mt-3 border border-blue-100">
                        <p className="text-sm text-gray-600 italic">
                          "{vocab.context}"
                        </p>
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                          vocab.masteryLevel === 5
                            ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                            : vocab.masteryLevel >= 3
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {"⭐".repeat(Math.max(1, vocab.masteryLevel))} Level{" "}
                        {vocab.masteryLevel}
                      </span>
                      {vocab.tags &&
                        vocab.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(vocab)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all hover:scale-110"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(vocab.id)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all hover:scale-110"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}