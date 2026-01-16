(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/hooks/vocabulary/useVocabData.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api.ts [app-client] (ecmascript)"); // Import api
var _s = __turbopack_context__.k.signature();
;
;
const useVocabData = (token)=>{
    _s();
    const [vocabs, setVocabs] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [page, setPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [totalPages, setTotalPages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [showStarredOnly, setShowStarredOnly] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [filters, setFilters] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        word: "",
        topic: "",
        partOfSpeech: "",
        meaning: ""
    });
    const [sortConfig, setSortConfig] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        key: "updatedAt",
        direction: "desc"
    });
    const [columnOrder, setColumnOrder] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([
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
        "actions"
    ]);
    const [draggedCol, setDraggedCol] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const debounceRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const fetchVocabs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useVocabData.useCallback[fetchVocabs]": async (pageNum = 1, currentFilters = filters, currentSort = sortConfig, starred = showStarredOnly)=>{
            if (!token) return;
            setLoading(true);
            try {
                const params = {
                    page: pageNum,
                    limit: 20,
                    ...currentFilters,
                    sortBy: currentSort.key,
                    sortOrder: currentSort.direction
                };
                if (starred) params.isStarred = "true";
                const res = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get("/vocabulary", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    params: params
                });
                setVocabs(res.data.data);
                setTotalPages(res.data.meta.lastPage);
                setPage(res.data.meta.page);
            } catch (error) {
                console.error("Fetch error:", error);
            } finally{
                setLoading(false);
            }
        }
    }["useVocabData.useCallback[fetchVocabs]"], [
        token,
        filters,
        sortConfig,
        showStarredOnly
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useVocabData.useEffect": ()=>{
            fetchVocabs();
        }
    }["useVocabData.useEffect"], [
        fetchVocabs
    ]);
    const handleFilterChange = (field, value)=>{
        const newFilters = {
            ...filters,
            [field]: value
        };
        setFilters(newFilters);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(()=>fetchVocabs(1, newFilters, sortConfig), 500);
    };
    const handleSort = (key)=>{
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
        const newSortConfig = {
            key,
            direction
        };
        setSortConfig(newSortConfig);
        fetchVocabs(1, filters, newSortConfig);
    };
    const handleToggleStar = async (id, currentStatus, e)=>{
        if (e) e.stopPropagation();
        // Optimistic update
        const toggleFunc = (list)=>list.map((item)=>item.id === id ? {
                    ...item,
                    isStarred: !currentStatus
                } : item);
        setVocabs(toggleFunc);
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].patch(`/vocabulary/${id}`, {
                isStarred: !currentStatus
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
        } catch (error_0) {
            console.error("Failed to star", error_0);
            // Revert on failure
            setVocabs((prev)=>prev.map((item_0)=>item_0.id === id ? {
                        ...item_0,
                        isStarred: currentStatus
                    } : item_0));
        }
    };
    const triggerInteraction = async (vocab)=>{
        try {
            const newOccurrence = (vocab.occurrence || 0) + 1;
            const newTime = new Date().toISOString();
            // Optimistic update
            setVocabs((prev_1)=>prev_1.map((v_0)=>v_0.id === vocab.id ? {
                        ...v_0,
                        occurrence: newOccurrence,
                        updatedAt: newTime
                    } : v_0));
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].patch(`/vocabulary/${vocab.id}`, {
                occurrence: newOccurrence
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
        } catch (e_0) {
            console.error("Interaction update failed", e_0);
            // Revert on failure
            setVocabs((prev_0)=>prev_0.map((v)=>v.id === vocab.id ? {
                        ...v,
                        occurrence: vocab.occurrence,
                        updatedAt: vocab.updatedAt
                    } : v));
        }
    };
    const handleDragStart = (e_1, colId)=>{
        setDraggedCol(colId);
        e_1.dataTransfer.effectAllowed = "move";
    };
    const handleDragOver = (e_2, colId_0)=>{
        e_2.preventDefault();
        if (!draggedCol || draggedCol === colId_0) return;
        const newOrder = [
            ...columnOrder
        ];
        const draggedIdx = newOrder.indexOf(draggedCol);
        const targetIdx = newOrder.indexOf(colId_0);
        if (draggedIdx !== -1 && targetIdx !== -1) {
            newOrder.splice(draggedIdx, 1);
            newOrder.splice(targetIdx, 0, draggedCol);
            setColumnOrder(newOrder);
        }
    };
    const handleDragEnd = ()=>{
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
        handleDragStart,
        handleDragOver,
        handleDragEnd
    };
};
_s(useVocabData, "sHWHabaKPo9RLIFerDFLbLf4lFY=");
const __TURBOPACK__default__export__ = useVocabData;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/hooks/vocabulary/useVocabModals.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api.ts [app-client] (ecmascript)"); // Import api for backend calls
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [app-client] (ecmascript)"); // Keep for external APIs (DictionaryAPI, Translate)
var _s = __turbopack_context__.k.signature();
;
;
;
const useVocabModals = (token, fetchVocabs)=>{
    _s();
    const [selectedVocab, setSelectedVocab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isModalOpen, setIsModalOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isAutoFilling, setIsAutoFilling] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [formData, setFormData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        word: "",
        meaning: "",
        example: "",
        topic: "",
        partOfSpeech: "",
        relatedWords: "",
        pronunciation: ""
    });
    const fileInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [isUploading, setIsUploading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const triggerInteraction = async (vocab)=>{
        try {
            const newOccurrence = (vocab.occurrence || 0) + 1;
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].patch(`/vocabulary/${vocab.id}`, {
                occurrence: newOccurrence
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
        } catch (e) {
            console.error("Interaction update failed", e);
        }
    };
    const handleRowClick = (vocab_0)=>{
        setSelectedVocab(vocab_0);
        setFormData({
            word: vocab_0.word,
            meaning: vocab_0.meaning || "",
            example: vocab_0.example || "",
            topic: vocab_0.topic || "",
            partOfSpeech: vocab_0.partOfSpeech || "",
            relatedWords: vocab_0.relatedWords || "",
            pronunciation: vocab_0.pronunciation || ""
        });
        setIsModalOpen(true);
        triggerInteraction(vocab_0);
    };
    const fetchAutoFillData = async (word)=>{
        if (!word) return null;
        setIsAutoFilling(true);
        try {
            const dictPromise = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`).catch(()=>null);
            const translatePromise = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(word)}`).catch(()=>null);
            const [dictRes, transRes] = await Promise.all([
                dictPromise,
                translatePromise
            ]);
            let newData = {
                word: word
            };
            if (dictRes && dictRes.data && dictRes.data[0]) {
                const entry = dictRes.data[0];
                if (entry.phonetic) newData.pronunciation = entry.phonetic;
                else if (entry.phonetics && entry.phonetics.length > 0) {
                    const p = entry.phonetics.find((x)=>x.text && x.audio);
                    newData.pronunciation = p ? p.text : entry.phonetics[0].text;
                }
                if (entry.meanings && entry.meanings.length > 0) {
                    const meaning = entry.meanings[0];
                    newData.partOfSpeech = meaning.partOfSpeech;
                    if (meaning.definitions) {
                        const defWithExample = meaning.definitions.find((d)=>d.example);
                        if (defWithExample) newData.example = defWithExample.example;
                    }
                }
            }
            if (transRes && transRes.data && transRes.data[0]) {
                const translatedText = transRes.data[0].map((item)=>item[0]).join("");
                newData.meaning = translatedText;
            }
            return newData;
        } catch (error) {
            console.error("Auto-fill error:", error);
            return null;
        } finally{
            setIsAutoFilling(false);
        }
    };
    const handleOpenCreateModal = async (initialWord = "")=>{
        setSelectedVocab(null);
        setIsModalOpen(true);
        setFormData({
            word: initialWord,
            meaning: "",
            example: "",
            topic: "",
            partOfSpeech: "",
            relatedWords: "",
            pronunciation: ""
        });
        if (initialWord) {
            const autoData = await fetchAutoFillData(initialWord);
            if (autoData) {
                setFormData((prev)=>({
                        ...prev,
                        ...autoData
                    }));
            }
        }
    };
    const handleSave = async ()=>{
        if (!token || !formData.word) {
            alert("Word is required!");
            return;
        }
        try {
            if (selectedVocab) {
                await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].patch(`/vocabulary/${selectedVocab.id}`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            } else {
                await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].post("/vocabulary", {
                    ...formData,
                    isStarred: false
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            }
            setIsModalOpen(false);
            fetchVocabs();
        } catch (error_0) {
            console.error("Save failed", error_0);
            alert("Failed to save.");
        }
    };
    const handleDelete = async (id)=>{
        if (!confirm("Delete this word?")) return;
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].delete(`/vocabulary/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            fetchVocabs();
            setIsModalOpen(false);
        } catch (e_0) {
            alert("Failed");
        }
    };
    const handleFileChange = async (event)=>{
        const file = event.target.files?.[0];
        if (!file || !token) return;
        const formData_0 = new FormData();
        formData_0.append("file", file);
        try {
            setIsUploading(true);
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].post("/vocabulary/import/csv", formData_0, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data"
                }
            });
            alert("Import success!");
            fetchVocabs(1);
        } catch (error_1) {
            alert("Import failed!");
        } finally{
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };
    return {
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
        fetchAutoFillData
    };
};
_s(useVocabModals, "jmi/NKVCYHt38T/KRNDyafS4CJQ=");
const __TURBOPACK__default__export__ = useVocabModals;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/hooks/vocabulary/usePronunciationAssessment.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api.ts [app-client] (ecmascript)"); // Import api for backend
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [app-client] (ecmascript)"); // Keep for Azure API
var _s = __turbopack_context__.k.signature();
;
;
;
// --- HELPERS ---
async function convertAudioToWav(audioBlob) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
    });
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const pcmData = audioBuffer.getChannelData(0);
    const wavBuffer = encodeWAV(pcmData, 16000);
    return new Blob([
        wavBuffer
    ], {
        type: "audio/wav"
    });
}
function encodeWAV(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeString = (view, offset, string)=>{
        for(let i = 0; i < string.length; i++){
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, "data");
    view.setUint32(40, samples.length * 2, true);
    let offset = 44;
    for(let i = 0; i < samples.length; i++, offset += 2){
        let s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return view;
}
const usePronunciationAssessment = (token, fetchVocabs, page)=>{
    _s();
    const [isAssessmentModalOpen, setIsAssessmentModalOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [recordingVocabItem, setRecordingVocabItem] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isRecording, setIsRecording] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [assessmentResult, setAssessmentResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [assessmentError, setAssessmentError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [isProcessingAudio, setIsProcessingAudio] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const mediaRecorderRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const audioChunksRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    const [userAudioUrl, setUserAudioUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const handleOpenAssessment = (item, e)=>{
        if (e) e.stopPropagation();
        const vocabItem = "id" in item ? item : {
            ...item,
            id: "temp",
            occurrence: 0,
            isStarred: false,
            pronunciationScores: [],
            createdAt: "",
            updatedAt: ""
        };
        setRecordingVocabItem(vocabItem);
        setAssessmentResult(null);
        setAssessmentError("");
        setUserAudioUrl(null);
        setIsAssessmentModalOpen(true);
    };
    const startRecording = async ()=>{
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = (event)=>{
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };
            mediaRecorder.onstop = async ()=>{
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: "audio/webm"
                });
                const audioUrl = URL.createObjectURL(audioBlob);
                setUserAudioUrl(audioUrl);
                await processAudio(audioBlob);
                stream.getTracks().forEach((track)=>track.stop());
            };
            mediaRecorder.start();
            setIsRecording(true);
            setAssessmentError("");
        } catch (err) {
            setAssessmentError("Microphone access denied.");
        }
    };
    const stopRecording = ()=>{
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "usePronunciationAssessment.useEffect": ()=>{
            let timer;
            if (isAssessmentModalOpen) {
                timer = setTimeout({
                    "usePronunciationAssessment.useEffect": ()=>{
                        if (!isRecording) {
                            startRecording();
                        }
                    }
                }["usePronunciationAssessment.useEffect"], 300);
            } else {
                stopRecording();
            }
            return ({
                "usePronunciationAssessment.useEffect": ()=>clearTimeout(timer)
            })["usePronunciationAssessment.useEffect"];
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }
    }["usePronunciationAssessment.useEffect"], [
        isAssessmentModalOpen
    ]);
    const processAudio = async (audioBlob)=>{
        if (!recordingVocabItem) return;
        setIsProcessingAudio(true);
        try {
            const azureKey = localStorage.getItem("azureKey");
            const azureRegion = localStorage.getItem("azureRegion");
            if (!azureKey || !azureRegion) throw new Error("Missing Azure Keys.");
            const wavBlob = await convertAudioToWav(audioBlob);
            const assessParams = {
                ReferenceText: recordingVocabItem.word,
                GradingSystem: "HundredMark",
                Granularity: "Phoneme",
                Dimension: "Comprehensive",
                PhonemeAlphabet: "IPA"
            };
            const paramsHeader = btoa(JSON.stringify(assessParams));
            const url = `https://${azureRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`;
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].post(url, wavBlob, {
                headers: {
                    "Ocp-Apim-Subscription-Key": azureKey,
                    "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
                    Accept: "application/json",
                    "Pronunciation-Assessment": paramsHeader
                }
            });
            const data = response.data;
            if (data.NBest && data.NBest[0]) {
                const result = data.NBest[0];
                const score = result.PronunciationAssessment?.AccuracyScore || result.AccuracyScore;
                setAssessmentResult({
                    AccuracyScore: score,
                    Words: result.Words
                });
                if (recordingVocabItem.id !== "temp") {
                    await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].patch(`/vocabulary/${recordingVocabItem.id}/score`, {
                        score: Math.round(score)
                    }, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    fetchVocabs(page);
                }
            } else {
                setAssessmentError("Could not recognize speech.");
            }
        } catch (err) {
            setAssessmentError(err.message);
        } finally{
            setIsProcessingAudio(false);
        }
    };
    // apps/frontend/hooks/vocabulary/usePronunciationAssessment.ts
    const handleSpeak = (text, e)=>{
        if (e) e.stopPropagation();
        if (!text) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = 0.9; // Tốc độ đọc (0.9 là vừa phải)
        // 👇 LOGIC MỚI: Ưu tiên tuyệt đối cho Microsoft Aria Online
        const getVoice = ()=>{
            const voices = window.speechSynthesis.getVoices();
            // 1. Tìm chính xác giọng Microsoft Aria Online (Ưu tiên số 1)
            const ariaOnline = voices.find((v)=>v.name.includes("Microsoft Aria Online"));
            if (ariaOnline) return ariaOnline;
            // 2. Nếu không có Online, tìm giọng Aria bất kỳ (Ưu tiên số 2)
            const ariaAny = voices.find((v)=>v.name.includes("Aria"));
            if (ariaAny) return ariaAny;
            // 3. Fallback: Tìm giọng US English tự nhiên (Google US English, etc.)
            return voices.find((v)=>v.lang === "en-US" && !v.name.includes("Zira"));
        };
        const preferredVoice = getVoice();
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        // console.log("Using voice:", preferredVoice.name); // Bật dòng này để debug xem nó đang dùng giọng nào
        }
        window.speechSynthesis.speak(utterance);
    };
    return {
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
        handleSpeak
    };
};
_s(usePronunciationAssessment, "lNjdfzQQ01Cpw/cHDtuwh8tnhjA=");
const __TURBOPACK__default__export__ = usePronunciationAssessment;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/hooks/vocabulary/useQuickSearch.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api.ts [app-client] (ecmascript)"); // Import api
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
;
;
const useQuickSearch = (token, handleOpenCreateModal)=>{
    _s();
    const [showSearch, setShowSearch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [quickSearchText, setQuickSearchText] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [quickSearchResults, setQuickSearchResults] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isSearching, setIsSearching] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const searchInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const quickSearchDebounce = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useQuickSearch.useEffect": ()=>{
            const isSearchPath = pathname?.endsWith("/search");
            const hasSearchParam = searchParams.get("openSearch") === "true";
            if (isSearchPath || hasSearchParam) {
                setShowSearch(true);
                setQuickSearchText("");
                setTimeout({
                    "useQuickSearch.useEffect": ()=>{
                        if (searchInputRef.current) {
                            searchInputRef.current.focus();
                        }
                    }
                }["useQuickSearch.useEffect"], 100);
            }
        }
    }["useQuickSearch.useEffect"], [
        pathname,
        searchParams
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useQuickSearch.useEffect": ()=>{
            let lastKeyPressTime = 0;
            const handleKeyDown = {
                "useQuickSearch.useEffect.handleKeyDown": (e)=>{
                    const target = e.target;
                    const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
                    if (isInputFocused && !showSearch) return;
                    if (e.code === "Space") {
                        const currentTime = new Date().getTime();
                        if (currentTime - lastKeyPressTime < 300) {
                            e.preventDefault();
                            setShowSearch(true);
                            setQuickSearchText("");
                            setQuickSearchResults([]);
                            setTimeout({
                                "useQuickSearch.useEffect.handleKeyDown": ()=>searchInputRef.current?.focus()
                            }["useQuickSearch.useEffect.handleKeyDown"], 100);
                        }
                        lastKeyPressTime = currentTime;
                    }
                    if (e.code === "Escape") {
                        setShowSearch(false);
                    }
                }
            }["useQuickSearch.useEffect.handleKeyDown"];
            window.addEventListener("keydown", handleKeyDown);
            return ({
                "useQuickSearch.useEffect": ()=>window.removeEventListener("keydown", handleKeyDown)
            })["useQuickSearch.useEffect"];
        }
    }["useQuickSearch.useEffect"], [
        showSearch
    ]);
    const handleQuickSearchChange = (e_0)=>{
        const text = e_0.target.value;
        setQuickSearchText(text);
        if (quickSearchDebounce.current) clearTimeout(quickSearchDebounce.current);
        quickSearchDebounce.current = setTimeout(()=>performQuickSearch(text), 300);
    };
    const performQuickSearch = async (text_0)=>{
        if (!token || !text_0.trim()) {
            setQuickSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get("/vocabulary", {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                params: {
                    page: 1,
                    limit: 5,
                    search: text_0,
                    sortBy: "word",
                    sortOrder: "asc"
                }
            });
            setQuickSearchResults(res.data.data);
        } catch (error) {
            console.error("Quick search error", error);
        } finally{
            setIsSearching(false);
        }
    };
    const hasExactMatch = quickSearchResults.some((item)=>item.word.toLowerCase() === quickSearchText.trim().toLowerCase());
    return {
        showSearch,
        setShowSearch,
        quickSearchText,
        setQuickSearchText,
        quickSearchResults,
        isSearching,
        searchInputRef,
        hasExactMatch,
        handleQuickSearchChange
    };
};
_s(useQuickSearch, "3u/j6caxR3YB+wbgFSnydM4HMyA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
const __TURBOPACK__default__export__ = useQuickSearch;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/Icons.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MicrophoneIcon",
    ()=>MicrophoneIcon,
    "SpeakerIcon",
    ()=>SpeakerIcon,
    "StarIcon",
    ()=>StarIcon
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
;
;
const StarIcon = (t0)=>{
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(6);
    if ($[0] !== "c81a137ee296e2c95424707407a308aab344e2972e15c9fba9018b2d8d6f6a32") {
        for(let $i = 0; $i < 6; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "c81a137ee296e2c95424707407a308aab344e2972e15c9fba9018b2d8d6f6a32";
    }
    const { filled, className } = t0;
    const t1 = filled ? "currentColor" : "none";
    const t2 = filled ? "0" : "2";
    let t3;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 19,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[1] = t3;
    } else {
        t3 = $[1];
    }
    let t4;
    if ($[2] !== className || $[3] !== t1 || $[4] !== t2) {
        t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            fill: t1,
            stroke: "currentColor",
            strokeWidth: t2,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            className: className,
            width: "24",
            height: "24",
            children: t3
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 26,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[2] = className;
        $[3] = t1;
        $[4] = t2;
        $[5] = t4;
    } else {
        t4 = $[5];
    }
    return t4;
};
_c = StarIcon;
const SpeakerIcon = (t0)=>{
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(5);
    if ($[0] !== "c81a137ee296e2c95424707407a308aab344e2972e15c9fba9018b2d8d6f6a32") {
        for(let $i = 0; $i < 5; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "c81a137ee296e2c95424707407a308aab344e2972e15c9fba9018b2d8d6f6a32";
    }
    const { className } = t0;
    let t1;
    let t2;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polygon", {
            points: "11 5 6 9 2 9 2 15 6 15 11 19 11 5"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 50,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 51,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[1] = t1;
        $[2] = t2;
    } else {
        t1 = $[1];
        t2 = $[2];
    }
    let t3;
    if ($[3] !== className) {
        t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            width: "24",
            height: "24",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            className: className,
            children: [
                t1,
                t2
            ]
        }, void 0, true, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 60,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[3] = className;
        $[4] = t3;
    } else {
        t3 = $[4];
    }
    return t3;
};
_c1 = SpeakerIcon;
const MicrophoneIcon = (t0)=>{
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(7);
    if ($[0] !== "c81a137ee296e2c95424707407a308aab344e2972e15c9fba9018b2d8d6f6a32") {
        for(let $i = 0; $i < 7; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "c81a137ee296e2c95424707407a308aab344e2972e15c9fba9018b2d8d6f6a32";
    }
    const { className } = t0;
    let t1;
    let t2;
    let t3;
    let t4;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 84,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M19 10v2a7 7 0 0 1-14 0v-2"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 85,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
            x1: "12",
            y1: "19",
            x2: "12",
            y2: "23"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 86,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
            x1: "8",
            y1: "23",
            x2: "16",
            y2: "23"
        }, void 0, false, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 87,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[1] = t1;
        $[2] = t2;
        $[3] = t3;
        $[4] = t4;
    } else {
        t1 = $[1];
        t2 = $[2];
        t3 = $[3];
        t4 = $[4];
    }
    let t5;
    if ($[5] !== className) {
        t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            width: "24",
            height: "24",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            className: className,
            children: [
                t1,
                t2,
                t3,
                t4
            ]
        }, void 0, true, {
            fileName: "[project]/components/Icons.tsx",
            lineNumber: 100,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[5] = className;
        $[6] = t5;
    } else {
        t5 = $[6];
    }
    return t5;
};
_c2 = MicrophoneIcon;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "StarIcon");
__turbopack_context__.k.register(_c1, "SpeakerIcon");
__turbopack_context__.k.register(_c2, "MicrophoneIcon");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/vocabulary/VocabTable.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>VocabTable
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Icons.tsx [app-client] (ecmascript)");
;
;
;
function VocabTable(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(82);
    if ($[0] !== "7bce8ac9c4eb6d87c39fd19c76a8f59f727aa6f7d88cc218157a3d445784f3d0") {
        for(let $i = 0; $i < 82; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "7bce8ac9c4eb6d87c39fd19c76a8f59f727aa6f7d88cc218157a3d445784f3d0";
    }
    const { vocabs, loading, page, totalPages, setPage, fetchVocabs, filters, handleFilterChange, handleSort, sortConfig, columnOrder, handleDragStart, handleDragOver, handleDragEnd, draggedCol, handleRowClick, handleToggleStar, handleSpeak, handleOpenAssessment, triggerInteraction } = t0;
    let t1;
    if ($[1] !== fetchVocabs || $[2] !== filters || $[3] !== setPage || $[4] !== sortConfig) {
        t1 = ({
            "VocabTable[handlePageChange]": (newPage)=>{
                setPage(newPage);
                fetchVocabs(newPage, filters, sortConfig);
            }
        })["VocabTable[handlePageChange]"];
        $[1] = fetchVocabs;
        $[2] = filters;
        $[3] = setPage;
        $[4] = sortConfig;
        $[5] = t1;
    } else {
        t1 = $[5];
    }
    const handlePageChange = t1;
    let t2;
    if ($[6] !== sortConfig) {
        t2 = ({
            "VocabTable[getSortIcon]": (colKey)=>sortConfig.key !== colKey ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-gray-300 ml-1 opacity-50",
                    children: "↕"
                }, void 0, false, {
                    fileName: "[project]/components/vocabulary/VocabTable.tsx",
                    lineNumber: 77,
                    columnNumber: 72
                }, this) : sortConfig.direction === "asc" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "ml-1 text-indigo-600",
                    children: "▲"
                }, void 0, false, {
                    fileName: "[project]/components/vocabulary/VocabTable.tsx",
                    lineNumber: 77,
                    columnNumber: 164
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "ml-1 text-indigo-600",
                    children: "▼"
                }, void 0, false, {
                    fileName: "[project]/components/vocabulary/VocabTable.tsx",
                    lineNumber: 77,
                    columnNumber: 214
                }, this)
        })["VocabTable[getSortIcon]"];
        $[6] = sortConfig;
        $[7] = t2;
    } else {
        t2 = $[7];
    }
    const getSortIcon = t2;
    let t3;
    if ($[8] !== handleToggleStar) {
        t3 = (v)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: {
                    "VocabTable[<anonymous> > <button>.onClick]": (e)=>handleToggleStar(v.id, v.isStarred, e)
                }["VocabTable[<anonymous> > <button>.onClick]"],
                className: "hover:bg-gray-100 rounded-full p-1",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StarIcon"], {
                    filled: v.isStarred,
                    className: v.isStarred ? "text-yellow-400 w-5 h-5" : "text-gray-300 w-5 h-5"
                }, void 0, false, {
                    fileName: "[project]/components/vocabulary/VocabTable.tsx",
                    lineNumber: 89,
                    columnNumber: 101
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/vocabulary/VocabTable.tsx",
                lineNumber: 87,
                columnNumber: 15
            }, this);
        $[8] = handleToggleStar;
        $[9] = t3;
    } else {
        t3 = $[9];
    }
    let t4;
    let t5;
    let t6;
    let t7;
    let t8;
    let t9;
    if ($[10] !== columnOrder || $[11] !== draggedCol || $[12] !== filters || $[13] !== getSortIcon || $[14] !== handleDragEnd || $[15] !== handleDragOver || $[16] !== handleDragStart || $[17] !== handleFilterChange || $[18] !== handleOpenAssessment || $[19] !== handleRowClick || $[20] !== handleSort || $[21] !== handleSpeak || $[22] !== loading || $[23] !== t3 || $[24] !== triggerInteraction || $[25] !== vocabs) {
        let t10;
        if ($[32] !== filters || $[33] !== handleFilterChange) {
            t10 = ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    className: "w-full border rounded px-2 py-1 text-xs outline-none focus:border-indigo-500",
                    placeholder: "Filter...",
                    value: filters.topic,
                    onChange: {
                        "VocabTable[<anonymous> > <input>.onChange]": (e_0)=>handleFilterChange("topic", e_0.target.value)
                    }["VocabTable[<anonymous> > <input>.onChange]"]
                }, void 0, false, {
                    fileName: "[project]/components/vocabulary/VocabTable.tsx",
                    lineNumber: 104,
                    columnNumber: 19
                }, this);
            $[32] = filters;
            $[33] = handleFilterChange;
            $[34] = t10;
        } else {
            t10 = $[34];
        }
        let t11;
        if ($[35] !== handleOpenAssessment || $[36] !== handleSpeak || $[37] !== triggerInteraction) {
            t11 = (v_2)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between gap-2 font-bold text-indigo-700",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: v_2.word
                        }, void 0, false, {
                            fileName: "[project]/components/vocabulary/VocabTable.tsx",
                            lineNumber: 115,
                            columnNumber: 103
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: {
                                        "VocabTable[<anonymous> > <button>.onClick]": (e_1)=>{
                                            handleOpenAssessment(v_2, e_1);
                                            triggerInteraction(v_2);
                                        }
                                    }["VocabTable[<anonymous> > <button>.onClick]"],
                                    className: "text-gray-400 hover:text-green-600 p-1 rounded-full hover:bg-green-50",
                                    title: "Practice Pronunciation",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MicrophoneIcon"], {
                                        className: "w-4 h-4"
                                    }, void 0, false, {
                                        fileName: "[project]/components/vocabulary/VocabTable.tsx",
                                        lineNumber: 120,
                                        columnNumber: 173
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/vocabulary/VocabTable.tsx",
                                    lineNumber: 115,
                                    columnNumber: 167
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: {
                                        "VocabTable[<anonymous> > <button>.onClick]": (e_2)=>{
                                            handleSpeak(v_2.word, e_2);
                                            triggerInteraction(v_2);
                                        }
                                    }["VocabTable[<anonymous> > <button>.onClick]"],
                                    className: "text-gray-400 hover:text-indigo-600 p-1 rounded-full hover:bg-indigo-50",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SpeakerIcon"], {
                                        className: "w-4 h-4"
                                    }, void 0, false, {
                                        fileName: "[project]/components/vocabulary/VocabTable.tsx",
                                        lineNumber: 125,
                                        columnNumber: 144
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/components/vocabulary/VocabTable.tsx",
                                    lineNumber: 120,
                                    columnNumber: 220
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/vocabulary/VocabTable.tsx",
                            lineNumber: 115,
                            columnNumber: 126
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/vocabulary/VocabTable.tsx",
                    lineNumber: 115,
                    columnNumber: 20
                }, this);
            $[35] = handleOpenAssessment;
            $[36] = handleSpeak;
            $[37] = triggerInteraction;
            $[38] = t11;
        } else {
            t11 = $[38];
        }
        let t12;
        if ($[39] !== filters || $[40] !== handleFilterChange) {
            t12 = ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    className: "w-full border rounded px-2 py-1 text-xs outline-none focus:border-indigo-500",
                    placeholder: "Filter...",
                    value: filters.word,
                    onChange: {
                        "VocabTable[<anonymous> > <input>.onChange]": (e_3)=>handleFilterChange("word", e_3.target.value)
                    }["VocabTable[<anonymous> > <input>.onChange]"]
                }, void 0, false, {
                    fileName: "[project]/components/vocabulary/VocabTable.tsx",
                    lineNumber: 135,
                    columnNumber: 19
                }, this);
            $[39] = filters;
            $[40] = handleFilterChange;
            $[41] = t12;
        } else {
            t12 = $[41];
        }
        let t13;
        if ($[42] !== filters || $[43] !== handleFilterChange) {
            t13 = ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    className: "w-full border rounded px-2 py-1 text-xs outline-none focus:border-indigo-500",
                    placeholder: "Meaning...",
                    value: filters.meaning,
                    onChange: {
                        "VocabTable[<anonymous> > <input>.onChange]": (e_4)=>handleFilterChange("meaning", e_4.target.value)
                    }["VocabTable[<anonymous> > <input>.onChange]"]
                }, void 0, false, {
                    fileName: "[project]/components/vocabulary/VocabTable.tsx",
                    lineNumber: 146,
                    columnNumber: 19
                }, this);
            $[42] = filters;
            $[43] = handleFilterChange;
            $[44] = t13;
        } else {
            t13 = $[44];
        }
        let t14;
        if ($[45] !== handleRowClick) {
            t14 = (v_9)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: {
                        "VocabTable[<anonymous> > <button>.onClick]": (e_5)=>{
                            e_5.stopPropagation();
                            handleRowClick(v_9);
                        }
                    }["VocabTable[<anonymous> > <button>.onClick]"],
                    className: "text-indigo-600 text-xs border border-indigo-200 px-2 py-1 rounded hover:bg-indigo-50",
                    children: "Edit"
                }, void 0, false, {
                    fileName: "[project]/components/vocabulary/VocabTable.tsx",
                    lineNumber: 157,
                    columnNumber: 20
                }, this);
            $[45] = handleRowClick;
            $[46] = t14;
        } else {
            t14 = $[46];
        }
        const columnConfig = {
            star: {
                label: "\u2605",
                width: "w-12",
                sortKey: "isStarred",
                renderCell: t3
            },
            updatedAt: {
                label: "Last Active",
                width: "w-32",
                sortKey: "updatedAt",
                renderCell: _temp
            },
            topic: {
                label: "Topic",
                width: "w-32",
                sortKey: "topic",
                renderCell: _temp2,
                renderFilter: t10
            },
            word: {
                label: "Word",
                width: "w-48",
                sortKey: "word",
                renderCell: t11,
                renderFilter: t12
            },
            pronunciation: {
                label: "Pronun.",
                width: "w-32",
                renderCell: _temp3
            },
            meaning: {
                label: "Meaning",
                width: "w-48",
                renderCell: _temp4,
                renderFilter: t13
            },
            example: {
                label: "Example",
                width: "w-64",
                renderCell: _temp5
            },
            relatedWords: {
                label: "Related",
                width: "w-40",
                renderCell: _temp6
            },
            occurrence: {
                label: "Count",
                width: "w-20",
                sortKey: "occurrence",
                renderCell: _temp7
            },
            score: {
                label: "Score",
                width: "w-20",
                renderCell: _temp8
            },
            actions: {
                label: "Action",
                width: "w-20",
                renderCell: t14
            }
        };
        t9 = "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col";
        t8 = "overflow-x-auto pb-4";
        t6 = "min-w-full divide-y divide-gray-200 table-fixed";
        t7 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
            className: "bg-gray-50 select-none",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                    children: columnOrder.map({
                        "VocabTable[columnOrder.map()]": (colId)=>{
                            const config = columnConfig[colId];
                            if (!config) {
                                return null;
                            }
                            const isDragging = draggedCol === colId;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                draggable: true,
                                onDragStart: {
                                    "VocabTable[columnOrder.map() > <th>.onDragStart]": (e_6)=>handleDragStart(e_6, colId)
                                }["VocabTable[columnOrder.map() > <th>.onDragStart]"],
                                onDragOver: {
                                    "VocabTable[columnOrder.map() > <th>.onDragOver]": (e_7)=>handleDragOver(e_7, colId)
                                }["VocabTable[columnOrder.map() > <th>.onDragOver]"],
                                onDragEnd: handleDragEnd,
                                onClick: {
                                    "VocabTable[columnOrder.map() > <th>.onClick]": ()=>config.sortKey && handleSort(config.sortKey)
                                }["VocabTable[columnOrder.map() > <th>.onClick]"],
                                className: `${config.width} px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase border-r border-gray-200 cursor-move hover:bg-gray-100 transition-all duration-200 ${isDragging ? "opacity-50 bg-indigo-50 border-2 border-indigo-300 scale-95 shadow-inner" : ""} ${colId === "actions" ? "sticky right-0 bg-gray-50 shadow-l z-10" : ""}`,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between pointer-events-none",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: config.label
                                        }, void 0, false, {
                                            fileName: "[project]/components/vocabulary/VocabTable.tsx",
                                            lineNumber: 249,
                                            columnNumber: 478
                                        }, this),
                                        config.sortKey && getSortIcon(config.sortKey)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/vocabulary/VocabTable.tsx",
                                    lineNumber: 249,
                                    columnNumber: 407
                                }, this)
                            }, colId, false, {
                                fileName: "[project]/components/vocabulary/VocabTable.tsx",
                                lineNumber: 243,
                                columnNumber: 20
                            }, this);
                        }
                    }["VocabTable[columnOrder.map()]"])
                }, void 0, false, {
                    fileName: "[project]/components/vocabulary/VocabTable.tsx",
                    lineNumber: 236,
                    columnNumber: 52
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                    className: "bg-white border-b border-gray-200",
                    children: columnOrder.map({
                        "VocabTable[columnOrder.map()]": (colId_0)=>{
                            const config_0 = columnConfig[colId_0];
                            if (!config_0) {
                                return null;
                            }
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                className: `p-2 border-r border-gray-100 ${colId_0 === "actions" ? "sticky right-0 bg-white z-10" : ""}`,
                                children: config_0.renderFilter ? config_0.renderFilter() : null
                            }, colId_0, false, {
                                fileName: "[project]/components/vocabulary/VocabTable.tsx",
                                lineNumber: 257,
                                columnNumber: 20
                            }, this);
                        }
                    }["VocabTable[columnOrder.map()]"])
                }, void 0, false, {
                    fileName: "[project]/components/vocabulary/VocabTable.tsx",
                    lineNumber: 251,
                    columnNumber: 50
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/VocabTable.tsx",
            lineNumber: 236,
            columnNumber: 10
        }, this);
        t4 = "bg-white divide-y divide-gray-200";
        t5 = loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                colSpan: columnOrder.length,
                className: "text-center py-10 text-gray-500",
                children: "Loading data..."
            }, void 0, false, {
                fileName: "[project]/components/vocabulary/VocabTable.tsx",
                lineNumber: 261,
                columnNumber: 24
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabTable.tsx",
            lineNumber: 261,
            columnNumber: 20
        }, this) : vocabs.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                colSpan: columnOrder.length,
                className: "text-center py-10 text-gray-500",
                children: "No vocabulary found."
            }, void 0, false, {
                fileName: "[project]/components/vocabulary/VocabTable.tsx",
                lineNumber: 261,
                columnNumber: 155
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabTable.tsx",
            lineNumber: 261,
            columnNumber: 151
        }, this) : vocabs.map({
            "VocabTable[vocabs.map()]": (vocab)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                    className: "hover:bg-indigo-50/50 group transition-colors cursor-pointer",
                    onClick: {
                        "VocabTable[vocabs.map() > <tr>.onClick]": ()=>handleRowClick(vocab)
                    }["VocabTable[vocabs.map() > <tr>.onClick]"],
                    children: columnOrder.map({
                        "VocabTable[vocabs.map() > columnOrder.map()]": (colId_1)=>{
                            const config_1 = columnConfig[colId_1];
                            if (!config_1) {
                                return null;
                            }
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                className: `px-4 py-3 text-sm border-r border-gray-100 align-top whitespace-normal break-words ${colId_1 === "actions" ? "sticky right-0 bg-white group-hover:bg-indigo-50/50 shadow-l z-10" : ""}`,
                                onClick: colId_1 === "actions" || colId_1 === "star" ? _temp9 : undefined,
                                children: config_1.renderCell(vocab)
                            }, colId_1, false, {
                                fileName: "[project]/components/vocabulary/VocabTable.tsx",
                                lineNumber: 270,
                                columnNumber: 20
                            }, this);
                        }
                    }["VocabTable[vocabs.map() > columnOrder.map()]"])
                }, vocab.id, false, {
                    fileName: "[project]/components/vocabulary/VocabTable.tsx",
                    lineNumber: 262,
                    columnNumber: 44
                }, this)
        }["VocabTable[vocabs.map()]"]);
        $[10] = columnOrder;
        $[11] = draggedCol;
        $[12] = filters;
        $[13] = getSortIcon;
        $[14] = handleDragEnd;
        $[15] = handleDragOver;
        $[16] = handleDragStart;
        $[17] = handleFilterChange;
        $[18] = handleOpenAssessment;
        $[19] = handleRowClick;
        $[20] = handleSort;
        $[21] = handleSpeak;
        $[22] = loading;
        $[23] = t3;
        $[24] = triggerInteraction;
        $[25] = vocabs;
        $[26] = t4;
        $[27] = t5;
        $[28] = t6;
        $[29] = t7;
        $[30] = t8;
        $[31] = t9;
    } else {
        t4 = $[26];
        t5 = $[27];
        t6 = $[28];
        t7 = $[29];
        t8 = $[30];
        t9 = $[31];
    }
    let t10;
    if ($[47] !== t4 || $[48] !== t5) {
        t10 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
            className: t4,
            children: t5
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabTable.tsx",
            lineNumber: 306,
            columnNumber: 11
        }, this);
        $[47] = t4;
        $[48] = t5;
        $[49] = t10;
    } else {
        t10 = $[49];
    }
    let t11;
    if ($[50] !== t10 || $[51] !== t6 || $[52] !== t7) {
        t11 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
            className: t6,
            children: [
                t7,
                t10
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/VocabTable.tsx",
            lineNumber: 315,
            columnNumber: 11
        }, this);
        $[50] = t10;
        $[51] = t6;
        $[52] = t7;
        $[53] = t11;
    } else {
        t11 = $[53];
    }
    let t12;
    if ($[54] !== t11 || $[55] !== t8) {
        t12 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: t8,
            children: t11
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabTable.tsx",
            lineNumber: 325,
            columnNumber: 11
        }, this);
        $[54] = t11;
        $[55] = t8;
        $[56] = t12;
    } else {
        t12 = $[56];
    }
    const t13 = page <= 1;
    let t14;
    if ($[57] !== handlePageChange || $[58] !== page) {
        t14 = ({
            "VocabTable[<button>.onClick]": ()=>handlePageChange(page - 1)
        })["VocabTable[<button>.onClick]"];
        $[57] = handlePageChange;
        $[58] = page;
        $[59] = t14;
    } else {
        t14 = $[59];
    }
    let t15;
    if ($[60] !== t13 || $[61] !== t14) {
        t15 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            disabled: t13,
            onClick: t14,
            className: "px-4 py-2 bg-white border rounded shadow-sm hover:bg-gray-100 disabled:opacity-50 text-sm font-medium",
            children: "← Previous"
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabTable.tsx",
            lineNumber: 346,
            columnNumber: 11
        }, this);
        $[60] = t13;
        $[61] = t14;
        $[62] = t15;
    } else {
        t15 = $[62];
    }
    let t16;
    if ($[63] !== page) {
        t16 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-indigo-600 font-bold",
            children: page
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabTable.tsx",
            lineNumber: 355,
            columnNumber: 11
        }, this);
        $[63] = page;
        $[64] = t16;
    } else {
        t16 = $[64];
    }
    let t17;
    if ($[65] !== t16 || $[66] !== totalPages) {
        t17 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-sm font-medium text-gray-600",
            children: [
                "Page ",
                t16,
                " of",
                " ",
                totalPages
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/VocabTable.tsx",
            lineNumber: 363,
            columnNumber: 11
        }, this);
        $[65] = t16;
        $[66] = totalPages;
        $[67] = t17;
    } else {
        t17 = $[67];
    }
    const t18 = page >= totalPages;
    let t19;
    if ($[68] !== handlePageChange || $[69] !== page) {
        t19 = ({
            "VocabTable[<button>.onClick]": ()=>handlePageChange(page + 1)
        })["VocabTable[<button>.onClick]"];
        $[68] = handlePageChange;
        $[69] = page;
        $[70] = t19;
    } else {
        t19 = $[70];
    }
    let t20;
    if ($[71] !== t18 || $[72] !== t19) {
        t20 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            disabled: t18,
            onClick: t19,
            className: "px-4 py-2 bg-white border rounded shadow-sm hover:bg-gray-100 disabled:opacity-50 text-sm font-medium",
            children: "Next →"
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabTable.tsx",
            lineNumber: 384,
            columnNumber: 11
        }, this);
        $[71] = t18;
        $[72] = t19;
        $[73] = t20;
    } else {
        t20 = $[73];
    }
    let t21;
    if ($[74] !== t15 || $[75] !== t17 || $[76] !== t20) {
        t21 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center sticky bottom-0 z-20",
            children: [
                t15,
                t17,
                t20
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/VocabTable.tsx",
            lineNumber: 393,
            columnNumber: 11
        }, this);
        $[74] = t15;
        $[75] = t17;
        $[76] = t20;
        $[77] = t21;
    } else {
        t21 = $[77];
    }
    let t22;
    if ($[78] !== t12 || $[79] !== t21 || $[80] !== t9) {
        t22 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: t9,
            children: [
                t12,
                t21
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/VocabTable.tsx",
            lineNumber: 403,
            columnNumber: 11
        }, this);
        $[78] = t12;
        $[79] = t21;
        $[80] = t9;
        $[81] = t22;
    } else {
        t22 = $[81];
    }
    return t22;
}
_c = VocabTable;
function _temp9(e_8) {
    return e_8.stopPropagation();
}
function _temp8(v_8) {
    const scores = v_8.pronunciationScores || [];
    if (scores.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-gray-300 text-xs",
            children: "-"
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabTable.tsx",
            lineNumber: 419,
            columnNumber: 12
        }, this);
    }
    const recentScores = scores.slice(-3);
    const avg = Math.round(recentScores.reduce(_VocabTableAnonymousRecentScoresReduce, 0) / recentScores.length);
    let colorClass = "bg-red-100 text-red-700";
    if (avg >= 80) {
        colorClass = "bg-green-100 text-green-700";
    } else {
        if (avg >= 60) {
            colorClass = "bg-yellow-100 text-yellow-700";
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col items-center",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: `text-xs font-bold px-2 py-0.5 rounded ${colorClass}`,
            children: avg
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabTable.tsx",
            lineNumber: 431,
            columnNumber: 54
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/vocabulary/VocabTable.tsx",
        lineNumber: 431,
        columnNumber: 10
    }, this);
}
function _VocabTableAnonymousRecentScoresReduce(a, b) {
    return a + b;
}
function _temp7(v_7) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "text-center font-semibold text-gray-500",
        children: v_7.occurrence
    }, void 0, false, {
        fileName: "[project]/components/vocabulary/VocabTable.tsx",
        lineNumber: 437,
        columnNumber: 10
    }, this);
}
function _temp6(v_6) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "text-gray-500 text-xs",
        children: v_6.relatedWords
    }, void 0, false, {
        fileName: "[project]/components/vocabulary/VocabTable.tsx",
        lineNumber: 440,
        columnNumber: 10
    }, this);
}
function _temp5(v_5) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "italic text-gray-500 text-xs line-clamp-2",
        title: v_5.example || "",
        children: v_5.example
    }, void 0, false, {
        fileName: "[project]/components/vocabulary/VocabTable.tsx",
        lineNumber: 443,
        columnNumber: 10
    }, this);
}
function _temp4(v_4) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "text-gray-800 text-sm line-clamp-2",
        title: v_4.meaning || "",
        children: v_4.meaning
    }, void 0, false, {
        fileName: "[project]/components/vocabulary/VocabTable.tsx",
        lineNumber: 446,
        columnNumber: 10
    }, this);
}
function _temp3(v_3) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "font-mono text-gray-500 text-xs",
        children: v_3.pronunciation
    }, void 0, false, {
        fileName: "[project]/components/vocabulary/VocabTable.tsx",
        lineNumber: 449,
        columnNumber: 10
    }, this);
}
function _temp2(v_1) {
    return v_1.topic && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "bg-gray-100 px-2 py-0.5 rounded text-xs",
        children: v_1.topic
    }, void 0, false, {
        fileName: "[project]/components/vocabulary/VocabTable.tsx",
        lineNumber: 452,
        columnNumber: 23
    }, this);
}
function _temp(v_0) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "font-mono text-xs text-gray-500",
        children: [
            new Date(v_0.updatedAt).toLocaleDateString(),
            " ",
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                fileName: "[project]/components/vocabulary/VocabTable.tsx",
                lineNumber: 455,
                columnNumber: 106
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-gray-400",
                children: new Date(v_0.updatedAt).toLocaleTimeString()
            }, void 0, false, {
                fileName: "[project]/components/vocabulary/VocabTable.tsx",
                lineNumber: 455,
                columnNumber: 112
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/vocabulary/VocabTable.tsx",
        lineNumber: 455,
        columnNumber: 10
    }, this);
}
var _c;
__turbopack_context__.k.register(_c, "VocabTable");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/vocabulary/VocabFormModal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>VocabFormModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Icons.tsx [app-client] (ecmascript)");
;
;
;
function VocabFormModal(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(120);
    if ($[0] !== "58d8fe86ce1a17bfae7eb25d20efc3f73cffee898bf713401c71b2103fceef52") {
        for(let $i = 0; $i < 120; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "58d8fe86ce1a17bfae7eb25d20efc3f73cffee898bf713401c71b2103fceef52";
    }
    const { isOpen, onClose, initialData: formData, setInitialData: setFormData, isEditMode, onSave, onDelete, isAutoFilling, fetchAutoFillData, handleOpenAssessment, handleSpeak, selectedVocab } = t0;
    if (!isOpen) {
        return null;
    }
    let t1;
    if ($[1] !== fetchAutoFillData || $[2] !== formData || $[3] !== isEditMode || $[4] !== setFormData) {
        t1 = ({
            "VocabFormModal[handleAutoFill]": async ()=>{
                if (!isEditMode) {
                    const autoData = await fetchAutoFillData(formData.word);
                    if (autoData) {
                        setFormData({
                            ...formData,
                            ...autoData
                        });
                    }
                }
            }
        })["VocabFormModal[handleAutoFill]"];
        $[1] = fetchAutoFillData;
        $[2] = formData;
        $[3] = isEditMode;
        $[4] = setFormData;
        $[5] = t1;
    } else {
        t1 = $[5];
    }
    const handleAutoFill = t1;
    const t2 = isEditMode ? "Editing Vocabulary" : "Create New Vocabulary";
    let t3;
    if ($[6] !== t2) {
        t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "text-xs uppercase tracking-wider opacity-80 mb-2",
            children: t2
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 72,
            columnNumber: 10
        }, this);
        $[6] = t2;
        $[7] = t3;
    } else {
        t3 = $[7];
    }
    const t4 = formData.word || "";
    let t5;
    if ($[8] !== formData || $[9] !== setFormData) {
        t5 = ({
            "VocabFormModal[<input>.onChange]": (e_0)=>setFormData({
                    ...formData,
                    word: e_0.target.value
                })
        })["VocabFormModal[<input>.onChange]"];
        $[8] = formData;
        $[9] = setFormData;
        $[10] = t5;
    } else {
        t5 = $[10];
    }
    const t6 = !isEditMode;
    let t7;
    if ($[11] !== handleAutoFill || $[12] !== t4 || $[13] !== t5 || $[14] !== t6) {
        t7 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
            value: t4,
            onChange: t5,
            onBlur: handleAutoFill,
            className: "bg-transparent text-4xl font-bold text-white placeholder-white/50 outline-none w-full border-b border-white/20 pb-1 focus:border-white transition-colors",
            placeholder: "Word...",
            autoFocus: t6
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 96,
            columnNumber: 10
        }, this);
        $[11] = handleAutoFill;
        $[12] = t4;
        $[13] = t5;
        $[14] = t6;
        $[15] = t7;
    } else {
        t7 = $[15];
    }
    let t8;
    if ($[16] !== isAutoFilling) {
        t8 = isAutoFilling && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "text-xs text-indigo-200 animate-pulse ml-2 whitespace-nowrap",
            children: "✨ Auto-filling..."
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 107,
            columnNumber: 27
        }, this);
        $[16] = isAutoFilling;
        $[17] = t8;
    } else {
        t8 = $[17];
    }
    let t9;
    if ($[18] !== formData || $[19] !== handleOpenAssessment || $[20] !== handleSpeak) {
        t9 = formData.word && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: {
                        "VocabFormModal[<button>.onClick]": (e_1)=>handleOpenAssessment(formData, e_1)
                    }["VocabFormModal[<button>.onClick]"],
                    className: "p-2 bg-white/20 rounded-full hover:bg-green-500 text-white transition-colors",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MicrophoneIcon"], {
                        className: "w-6 h-6"
                    }, void 0, false, {
                        fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
                        lineNumber: 117,
                        columnNumber: 135
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
                    lineNumber: 115,
                    columnNumber: 29
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: {
                        "VocabFormModal[<button>.onClick]": (e_2)=>handleSpeak(formData.word, e_2)
                    }["VocabFormModal[<button>.onClick]"],
                    className: "p-2 bg-white/20 rounded-full hover:bg-white/30 text-white",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SpeakerIcon"], {
                        className: "w-6 h-6"
                    }, void 0, false, {
                        fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
                        lineNumber: 119,
                        columnNumber: 116
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
                    lineNumber: 117,
                    columnNumber: 182
                }, this)
            ]
        }, void 0, true);
        $[18] = formData;
        $[19] = handleOpenAssessment;
        $[20] = handleSpeak;
        $[21] = t9;
    } else {
        t9 = $[21];
    }
    let t10;
    if ($[22] !== t7 || $[23] !== t8 || $[24] !== t9) {
        t10 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-3 w-full",
            children: [
                t7,
                t8,
                t9
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 129,
            columnNumber: 11
        }, this);
        $[22] = t7;
        $[23] = t8;
        $[24] = t9;
        $[25] = t10;
    } else {
        t10 = $[25];
    }
    let t11;
    if ($[26] !== t10 || $[27] !== t3) {
        t11 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-full",
            children: [
                t3,
                t10
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 139,
            columnNumber: 11
        }, this);
        $[26] = t10;
        $[27] = t3;
        $[28] = t11;
    } else {
        t11 = $[28];
    }
    let t12;
    if ($[29] !== onClose) {
        t12 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: onClose,
            className: "text-white/70 hover:text-white text-2xl font-bold ml-4",
            children: "✕"
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 148,
            columnNumber: 11
        }, this);
        $[29] = onClose;
        $[30] = t12;
    } else {
        t12 = $[30];
    }
    let t13;
    if ($[31] !== t11 || $[32] !== t12) {
        t13 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-indigo-600 p-6 text-white flex justify-between items-start shrink-0",
            children: [
                t11,
                t12
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 156,
            columnNumber: 11
        }, this);
        $[31] = t11;
        $[32] = t12;
        $[33] = t13;
    } else {
        t13 = $[33];
    }
    let t14;
    if ($[34] !== isAutoFilling) {
        t14 = isAutoFilling && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute inset-0 bg-white/50 z-10 flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
            }, void 0, false, {
                fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
                lineNumber: 165,
                columnNumber: 112
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 165,
            columnNumber: 28
        }, this);
        $[34] = isAutoFilling;
        $[35] = t14;
    } else {
        t14 = $[35];
    }
    let t15;
    if ($[36] === Symbol.for("react.memo_cache_sentinel")) {
        t15 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-xs font-bold text-gray-400 uppercase mb-1",
            children: "Pronunciation"
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 173,
            columnNumber: 11
        }, this);
        $[36] = t15;
    } else {
        t15 = $[36];
    }
    const t16 = formData.pronunciation || "";
    let t17;
    if ($[37] !== formData || $[38] !== setFormData) {
        t17 = ({
            "VocabFormModal[<input>.onChange]": (e_3)=>setFormData({
                    ...formData,
                    pronunciation: e_3.target.value
                })
        })["VocabFormModal[<input>.onChange]"];
        $[37] = formData;
        $[38] = setFormData;
        $[39] = t17;
    } else {
        t17 = $[39];
    }
    let t18;
    if ($[40] !== t16 || $[41] !== t17) {
        t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t15,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    value: t16,
                    onChange: t17,
                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm",
                    placeholder: "/.../"
                }, void 0, false, {
                    fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
                    lineNumber: 195,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 195,
            columnNumber: 11
        }, this);
        $[40] = t16;
        $[41] = t17;
        $[42] = t18;
    } else {
        t18 = $[42];
    }
    let t19;
    if ($[43] === Symbol.for("react.memo_cache_sentinel")) {
        t19 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-xs font-bold text-gray-400 uppercase mb-1",
            children: "Part Of Speech"
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 204,
            columnNumber: 11
        }, this);
        $[43] = t19;
    } else {
        t19 = $[43];
    }
    const t20 = formData.partOfSpeech || "";
    let t21;
    if ($[44] !== formData || $[45] !== setFormData) {
        t21 = ({
            "VocabFormModal[<select>.onChange]": (e_4)=>setFormData({
                    ...formData,
                    partOfSpeech: e_4.target.value
                })
        })["VocabFormModal[<select>.onChange]"];
        $[44] = formData;
        $[45] = setFormData;
        $[46] = t21;
    } else {
        t21 = $[46];
    }
    let t22;
    let t23;
    let t24;
    let t25;
    let t26;
    let t27;
    if ($[47] === Symbol.for("react.memo_cache_sentinel")) {
        t22 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
            value: "",
            children: "-- Select --"
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 231,
            columnNumber: 11
        }, this);
        t23 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
            value: "noun",
            children: "Noun"
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 232,
            columnNumber: 11
        }, this);
        t24 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
            value: "verb",
            children: "Verb"
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 233,
            columnNumber: 11
        }, this);
        t25 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
            value: "adjective",
            children: "Adjective"
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 234,
            columnNumber: 11
        }, this);
        t26 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
            value: "adverb",
            children: "Adverb"
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 235,
            columnNumber: 11
        }, this);
        t27 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
            value: "phrase",
            children: "Phrase"
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 236,
            columnNumber: 11
        }, this);
        $[47] = t22;
        $[48] = t23;
        $[49] = t24;
        $[50] = t25;
        $[51] = t26;
        $[52] = t27;
    } else {
        t22 = $[47];
        t23 = $[48];
        t24 = $[49];
        t25 = $[50];
        t26 = $[51];
        t27 = $[52];
    }
    let t28;
    if ($[53] !== t20 || $[54] !== t21) {
        t28 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t19,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                    value: t20,
                    onChange: t21,
                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white",
                    children: [
                        t22,
                        t23,
                        t24,
                        t25,
                        t26,
                        t27
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
                    lineNumber: 253,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 253,
            columnNumber: 11
        }, this);
        $[53] = t20;
        $[54] = t21;
        $[55] = t28;
    } else {
        t28 = $[55];
    }
    let t29;
    if ($[56] !== t18 || $[57] !== t28) {
        t29 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "grid grid-cols-2 gap-4",
            children: [
                t18,
                t28
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 262,
            columnNumber: 11
        }, this);
        $[56] = t18;
        $[57] = t28;
        $[58] = t29;
    } else {
        t29 = $[58];
    }
    let t30;
    if ($[59] === Symbol.for("react.memo_cache_sentinel")) {
        t30 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-xs font-bold text-gray-400 uppercase mb-1",
            children: "Meaning"
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 271,
            columnNumber: 11
        }, this);
        $[59] = t30;
    } else {
        t30 = $[59];
    }
    const t31 = formData.meaning || "";
    let t32;
    if ($[60] !== formData || $[61] !== setFormData) {
        t32 = ({
            "VocabFormModal[<textarea>.onChange]": (e_5)=>setFormData({
                    ...formData,
                    meaning: e_5.target.value
                })
        })["VocabFormModal[<textarea>.onChange]"];
        $[60] = formData;
        $[61] = setFormData;
        $[62] = t32;
    } else {
        t32 = $[62];
    }
    let t33;
    if ($[63] !== t31 || $[64] !== t32) {
        t33 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t30,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                    value: t31,
                    onChange: t32,
                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px] text-lg font-medium text-gray-800",
                    placeholder: "Ngh\u0129a c\u1EE7a t\u1EEB..."
                }, void 0, false, {
                    fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
                    lineNumber: 293,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 293,
            columnNumber: 11
        }, this);
        $[63] = t31;
        $[64] = t32;
        $[65] = t33;
    } else {
        t33 = $[65];
    }
    let t34;
    if ($[66] === Symbol.for("react.memo_cache_sentinel")) {
        t34 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-xs font-bold text-gray-400 uppercase mb-1",
            children: "Example"
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 302,
            columnNumber: 11
        }, this);
        $[66] = t34;
    } else {
        t34 = $[66];
    }
    const t35 = formData.example || "";
    let t36;
    if ($[67] !== formData || $[68] !== setFormData) {
        t36 = ({
            "VocabFormModal[<textarea>.onChange]": (e_6)=>setFormData({
                    ...formData,
                    example: e_6.target.value
                })
        })["VocabFormModal[<textarea>.onChange]"];
        $[67] = formData;
        $[68] = setFormData;
        $[69] = t36;
    } else {
        t36 = $[69];
    }
    let t37;
    if ($[70] !== t35 || $[71] !== t36) {
        t37 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t34,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                    value: t35,
                    onChange: t36,
                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 italic text-gray-600",
                    placeholder: "V\xED d\u1EE5..."
                }, void 0, false, {
                    fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
                    lineNumber: 324,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 324,
            columnNumber: 11
        }, this);
        $[70] = t35;
        $[71] = t36;
        $[72] = t37;
    } else {
        t37 = $[72];
    }
    let t38;
    if ($[73] === Symbol.for("react.memo_cache_sentinel")) {
        t38 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-xs font-bold text-gray-400 uppercase mb-1",
            children: "Topic"
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 333,
            columnNumber: 11
        }, this);
        $[73] = t38;
    } else {
        t38 = $[73];
    }
    const t39 = formData.topic || "";
    let t40;
    if ($[74] !== formData || $[75] !== setFormData) {
        t40 = ({
            "VocabFormModal[<input>.onChange]": (e_7)=>setFormData({
                    ...formData,
                    topic: e_7.target.value
                })
        })["VocabFormModal[<input>.onChange]"];
        $[74] = formData;
        $[75] = setFormData;
        $[76] = t40;
    } else {
        t40 = $[76];
    }
    let t41;
    if ($[77] !== t39 || $[78] !== t40) {
        t41 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t38,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    value: t39,
                    onChange: t40,
                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none",
                    placeholder: "IT, Travel..."
                }, void 0, false, {
                    fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
                    lineNumber: 355,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 355,
            columnNumber: 11
        }, this);
        $[77] = t39;
        $[78] = t40;
        $[79] = t41;
    } else {
        t41 = $[79];
    }
    let t42;
    if ($[80] === Symbol.for("react.memo_cache_sentinel")) {
        t42 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            className: "block text-xs font-bold text-gray-400 uppercase mb-1",
            children: "Related Words"
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 364,
            columnNumber: 11
        }, this);
        $[80] = t42;
    } else {
        t42 = $[80];
    }
    const t43 = formData.relatedWords || "";
    let t44;
    if ($[81] !== formData || $[82] !== setFormData) {
        t44 = ({
            "VocabFormModal[<input>.onChange]": (e_8)=>setFormData({
                    ...formData,
                    relatedWords: e_8.target.value
                })
        })["VocabFormModal[<input>.onChange]"];
        $[81] = formData;
        $[82] = setFormData;
        $[83] = t44;
    } else {
        t44 = $[83];
    }
    let t45;
    if ($[84] !== t43 || $[85] !== t44) {
        t45 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                t42,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    value: t43,
                    onChange: t44,
                    className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none",
                    placeholder: "Synonyms..."
                }, void 0, false, {
                    fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
                    lineNumber: 386,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 386,
            columnNumber: 11
        }, this);
        $[84] = t43;
        $[85] = t44;
        $[86] = t45;
    } else {
        t45 = $[86];
    }
    let t46;
    if ($[87] !== t41 || $[88] !== t45) {
        t46 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "grid grid-cols-2 gap-4",
            children: [
                t41,
                t45
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 395,
            columnNumber: 11
        }, this);
        $[87] = t41;
        $[88] = t45;
        $[89] = t46;
    } else {
        t46 = $[89];
    }
    let t47;
    if ($[90] !== t14 || $[91] !== t29 || $[92] !== t33 || $[93] !== t37 || $[94] !== t46) {
        t47 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-6 space-y-5 overflow-y-auto relative",
            children: [
                t14,
                t29,
                t33,
                t37,
                t46
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 404,
            columnNumber: 11
        }, this);
        $[90] = t14;
        $[91] = t29;
        $[92] = t33;
        $[93] = t37;
        $[94] = t46;
        $[95] = t47;
    } else {
        t47 = $[95];
    }
    let t48;
    if ($[96] !== selectedVocab) {
        t48 = selectedVocab ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "text-xs text-gray-400",
            children: [
                "Updated: ",
                new Date(selectedVocab.updatedAt).toLocaleString()
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 416,
            columnNumber: 27
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {}, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 416,
            columnNumber: 136
        }, this);
        $[96] = selectedVocab;
        $[97] = t48;
    } else {
        t48 = $[97];
    }
    let t49;
    if ($[98] !== isEditMode || $[99] !== onDelete) {
        t49 = isEditMode && onDelete && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: onDelete,
            className: "text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-red-200",
            children: "Delete"
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 424,
            columnNumber: 37
        }, this);
        $[98] = isEditMode;
        $[99] = onDelete;
        $[100] = t49;
    } else {
        t49 = $[100];
    }
    let t50;
    if ($[101] !== onClose) {
        t50 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: onClose,
            className: "text-gray-600 hover:bg-gray-200 px-5 py-2 rounded-lg text-sm font-medium transition-colors",
            children: "Cancel"
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 433,
            columnNumber: 11
        }, this);
        $[101] = onClose;
        $[102] = t50;
    } else {
        t50 = $[102];
    }
    const t51 = isEditMode ? "Save Changes" : "Create Word";
    let t52;
    if ($[103] !== onSave || $[104] !== t51) {
        t52 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: onSave,
            className: "bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md transform active:scale-95 transition-all",
            children: t51
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 442,
            columnNumber: 11
        }, this);
        $[103] = onSave;
        $[104] = t51;
        $[105] = t52;
    } else {
        t52 = $[105];
    }
    let t53;
    if ($[106] !== t49 || $[107] !== t50 || $[108] !== t52) {
        t53 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex gap-3",
            children: [
                t49,
                t50,
                t52
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 451,
            columnNumber: 11
        }, this);
        $[106] = t49;
        $[107] = t50;
        $[108] = t52;
        $[109] = t53;
    } else {
        t53 = $[109];
    }
    let t54;
    if ($[110] !== t48 || $[111] !== t53) {
        t54 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center shrink-0",
            children: [
                t48,
                t53
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 461,
            columnNumber: 11
        }, this);
        $[110] = t48;
        $[111] = t53;
        $[112] = t54;
    } else {
        t54 = $[112];
    }
    let t55;
    if ($[113] !== t13 || $[114] !== t47 || $[115] !== t54) {
        t55 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]",
            onClick: _VocabFormModalDivOnClick,
            children: [
                t13,
                t47,
                t54
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 470,
            columnNumber: 11
        }, this);
        $[113] = t13;
        $[114] = t47;
        $[115] = t54;
        $[116] = t55;
    } else {
        t55 = $[116];
    }
    let t56;
    if ($[117] !== onClose || $[118] !== t55) {
        t56 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4 backdrop-blur-sm",
            onClick: onClose,
            children: t55
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/VocabFormModal.tsx",
            lineNumber: 480,
            columnNumber: 11
        }, this);
        $[117] = onClose;
        $[118] = t55;
        $[119] = t56;
    } else {
        t56 = $[119];
    }
    return t56;
}
_c = VocabFormModal;
function _VocabFormModalDivOnClick(e) {
    return e.stopPropagation();
}
var _c;
__turbopack_context__.k.register(_c, "VocabFormModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/vocabulary/AssessmentModal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AssessmentModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Icons.tsx [app-client] (ecmascript)");
;
;
;
function AssessmentModal(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(55);
    if ($[0] !== "34dedae2da79f8011dbd1263194f16722fd4b2a5eddc1487906c8fdca0dc3dae") {
        for(let $i = 0; $i < 55; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "34dedae2da79f8011dbd1263194f16722fd4b2a5eddc1487906c8fdca0dc3dae";
    }
    const { isOpen, onClose, vocabItem, isRecording, assessmentResult, assessmentError, isProcessingAudio, userAudioUrl, startRecording, stopRecording, handleSpeak } = t0;
    if (!isOpen || !vocabItem) {
        return null;
    }
    let t1;
    if ($[1] !== onClose) {
        t1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: onClose,
            className: "absolute top-4 right-4 text-gray-400 hover:text-gray-600",
            children: "✕"
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
            lineNumber: 45,
            columnNumber: 10
        }, this);
        $[1] = onClose;
        $[2] = t1;
    } else {
        t1 = $[2];
    }
    let t2;
    if ($[3] !== vocabItem.word) {
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
            className: "text-3xl font-bold text-gray-800 mb-1",
            children: vocabItem.word
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
            lineNumber: 53,
            columnNumber: 10
        }, this);
        $[3] = vocabItem.word;
        $[4] = t2;
    } else {
        t2 = $[4];
    }
    let t3;
    if ($[5] !== vocabItem.pronunciation) {
        t3 = vocabItem.pronunciation && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "font-mono text-gray-500 text-lg",
            children: [
                "/",
                vocabItem.pronunciation,
                "/"
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
            lineNumber: 61,
            columnNumber: 37
        }, this);
        $[5] = vocabItem.pronunciation;
        $[6] = t3;
    } else {
        t3 = $[6];
    }
    let t4;
    if ($[7] !== vocabItem.meaning) {
        t4 = vocabItem.meaning && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-gray-600 text-center font-medium px-4 line-clamp-2",
            children: vocabItem.meaning
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
            lineNumber: 69,
            columnNumber: 31
        }, this);
        $[7] = vocabItem.meaning;
        $[8] = t4;
    } else {
        t4 = $[8];
    }
    let t5;
    if ($[9] !== t3 || $[10] !== t4) {
        t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-col items-center gap-1 mb-6",
            children: [
                t3,
                t4
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
            lineNumber: 77,
            columnNumber: 10
        }, this);
        $[9] = t3;
        $[10] = t4;
        $[11] = t5;
    } else {
        t5 = $[11];
    }
    let t6;
    if ($[12] !== assessmentResult) {
        t6 = assessmentResult ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative w-32 h-32 mb-6 flex items-center justify-center rounded-full border-8 transition-all duration-500 ease-out",
            style: {
                borderColor: assessmentResult.AccuracyScore >= 80 ? "#4caf50" : assessmentResult.AccuracyScore >= 60 ? "#ffeb3b" : "#ff5252"
            },
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-4xl font-bold",
                style: {
                    color: assessmentResult.AccuracyScore >= 80 ? "#4caf50" : assessmentResult.AccuracyScore >= 60 ? "#fbc02d" : "#ff5252"
                },
                children: Math.round(assessmentResult.AccuracyScore)
            }, void 0, false, {
                fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
                lineNumber: 88,
                columnNumber: 8
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
            lineNumber: 86,
            columnNumber: 29
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-32 h-32 mb-6 rounded-full border-4 border-gray-100 flex items-center justify-center bg-gray-50",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-4xl text-gray-300",
                children: "?"
            }, void 0, false, {
                fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
                lineNumber: 90,
                columnNumber: 184
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
            lineNumber: 90,
            columnNumber: 70
        }, this);
        $[12] = assessmentResult;
        $[13] = t6;
    } else {
        t6 = $[13];
    }
    let t7;
    if ($[14] !== handleSpeak || $[15] !== vocabItem.word) {
        t7 = ({
            "AssessmentModal[<button>.onClick]": (e_0)=>handleSpeak(vocabItem.word, e_0)
        })["AssessmentModal[<button>.onClick]"];
        $[14] = handleSpeak;
        $[15] = vocabItem.word;
        $[16] = t7;
    } else {
        t7 = $[16];
    }
    let t8;
    if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
        t8 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SpeakerIcon"], {
            className: "w-6 h-6"
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
            lineNumber: 109,
            columnNumber: 10
        }, this);
        $[17] = t8;
    } else {
        t8 = $[17];
    }
    let t9;
    if ($[18] !== t7) {
        t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t7,
            className: "w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 text-indigo-600 flex items-center justify-center transition-transform hover:scale-105 shadow-sm",
            title: "Nghe gi\u1ECDng chu\u1EA9n",
            children: t8
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
            lineNumber: 116,
            columnNumber: 10
        }, this);
        $[18] = t7;
        $[19] = t9;
    } else {
        t9 = $[19];
    }
    const t10 = isRecording ? stopRecording : startRecording;
    const t11 = `w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105 ${isRecording ? "bg-red-500 animate-pulse ring-4 ring-red-200" : "bg-indigo-600 hover:bg-indigo-700 ring-4 ring-indigo-100"}`;
    let t12;
    if ($[20] !== isRecording) {
        t12 = isRecording ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-6 h-6 bg-white rounded-sm"
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
            lineNumber: 126,
            columnNumber: 25
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MicrophoneIcon"], {
            className: "w-8 h-8 text-white"
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
            lineNumber: 126,
            columnNumber: 75
        }, this);
        $[20] = isRecording;
        $[21] = t12;
    } else {
        t12 = $[21];
    }
    let t13;
    if ($[22] !== t10 || $[23] !== t11 || $[24] !== t12) {
        t13 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t10,
            className: t11,
            children: t12
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
            lineNumber: 134,
            columnNumber: 11
        }, this);
        $[22] = t10;
        $[23] = t11;
        $[24] = t12;
        $[25] = t13;
    } else {
        t13 = $[25];
    }
    const t14 = !userAudioUrl;
    let t15;
    if ($[26] !== userAudioUrl) {
        t15 = ({
            "AssessmentModal[<button>.onClick]": ()=>{
                const audio = new Audio(userAudioUrl);
                audio.play();
            }
        })["AssessmentModal[<button>.onClick]"];
        $[26] = userAudioUrl;
        $[27] = t15;
    } else {
        t15 = $[27];
    }
    const t16 = `w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-sm ${userAudioUrl ? "bg-green-100 hover:bg-green-200 text-green-700 cursor-pointer" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`;
    let t17;
    if ($[28] === Symbol.for("react.memo_cache_sentinel")) {
        t17 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            className: "w-5 h-5",
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                }, void 0, false, {
                    fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
                    lineNumber: 159,
                    columnNumber: 125
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                }, void 0, false, {
                    fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
                    lineNumber: 159,
                    columnNumber: 295
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
            lineNumber: 159,
            columnNumber: 11
        }, this);
        $[28] = t17;
    } else {
        t17 = $[28];
    }
    let t18;
    if ($[29] !== t14 || $[30] !== t15 || $[31] !== t16) {
        t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            disabled: t14,
            onClick: t15,
            className: t16,
            title: "Nghe l\u1EA1i gi\u1ECDng b\u1EA1n",
            children: t17
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
            lineNumber: 166,
            columnNumber: 11
        }, this);
        $[29] = t14;
        $[30] = t15;
        $[31] = t16;
        $[32] = t18;
    } else {
        t18 = $[32];
    }
    let t19;
    if ($[33] !== t13 || $[34] !== t18 || $[35] !== t9) {
        t19 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mb-6 flex gap-6 items-center",
            children: [
                t9,
                t13,
                t18
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
            lineNumber: 176,
            columnNumber: 11
        }, this);
        $[33] = t13;
        $[34] = t18;
        $[35] = t9;
        $[36] = t19;
    } else {
        t19 = $[36];
    }
    let t20;
    if ($[37] !== isProcessingAudio) {
        t20 = isProcessingAudio && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "text-indigo-500 font-medium animate-pulse",
            children: "Analyzing..."
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
            lineNumber: 186,
            columnNumber: 32
        }, this);
        $[37] = isProcessingAudio;
        $[38] = t20;
    } else {
        t20 = $[38];
    }
    let t21;
    if ($[39] !== assessmentError) {
        t21 = assessmentError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "text-red-500 text-sm text-center bg-red-50 p-2 rounded",
            children: assessmentError
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
            lineNumber: 194,
            columnNumber: 30
        }, this);
        $[39] = assessmentError;
        $[40] = t21;
    } else {
        t21 = $[40];
    }
    let t22;
    if ($[41] !== assessmentResult) {
        t22 = assessmentResult && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-full bg-gray-50 rounded-xl p-4 mt-2 border border-gray-100",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap justify-center gap-x-4 gap-y-2",
                children: assessmentResult.Words.map(_AssessmentModalAssessmentResultWordsMap)
            }, void 0, false, {
                fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
                lineNumber: 202,
                columnNumber: 109
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
            lineNumber: 202,
            columnNumber: 31
        }, this);
        $[41] = assessmentResult;
        $[42] = t22;
    } else {
        t22 = $[42];
    }
    let t23;
    if ($[43] !== t1 || $[44] !== t19 || $[45] !== t2 || $[46] !== t20 || $[47] !== t21 || $[48] !== t22 || $[49] !== t5 || $[50] !== t6) {
        t23 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center p-8 relative animate-in fade-in zoom-in duration-200",
            onClick: _AssessmentModalDivOnClick,
            children: [
                t1,
                t2,
                t5,
                t6,
                t19,
                t20,
                t21,
                t22
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
            lineNumber: 210,
            columnNumber: 11
        }, this);
        $[43] = t1;
        $[44] = t19;
        $[45] = t2;
        $[46] = t20;
        $[47] = t21;
        $[48] = t22;
        $[49] = t5;
        $[50] = t6;
        $[51] = t23;
    } else {
        t23 = $[51];
    }
    let t24;
    if ($[52] !== onClose || $[53] !== t23) {
        t24 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "fixed inset-0 bg-black/80 z-[2147483649] flex items-center justify-center p-4 backdrop-blur-sm",
            onClick: onClose,
            children: t23
        }, void 0, false, {
            fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
            lineNumber: 225,
            columnNumber: 11
        }, this);
        $[52] = onClose;
        $[53] = t23;
        $[54] = t24;
    } else {
        t24 = $[54];
    }
    return t24;
}
_c = AssessmentModal;
function _AssessmentModalAssessmentResultWordsMap(word, idx) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col items-center",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `text-lg font-bold ${word.AccuracyScore >= 80 ? "text-green-700" : word.AccuracyScore >= 60 ? "text-yellow-600" : "text-red-600"}`,
                children: word.Word
            }, void 0, false, {
                fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
                lineNumber: 235,
                columnNumber: 64
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-0.5 mt-1",
                children: word.Phonemes?.map(_AssessmentModalAssessmentResultWordsMapAnonymous)
            }, void 0, false, {
                fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
                lineNumber: 235,
                columnNumber: 231
            }, this)
        ]
    }, idx, true, {
        fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
        lineNumber: 235,
        columnNumber: 10
    }, this);
}
function _AssessmentModalAssessmentResultWordsMapAnonymous(p, pIdx) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: `text-xs px-1 rounded min-w-[20px] text-center ${p.AccuracyScore >= 80 ? "bg-green-100 text-green-800" : p.AccuracyScore >= 60 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`,
        title: `/${p.Phoneme}/: ${p.AccuracyScore}`,
        children: p.Phoneme
    }, pIdx, false, {
        fileName: "[project]/components/vocabulary/AssessmentModal.tsx",
        lineNumber: 238,
        columnNumber: 10
    }, this);
}
function _AssessmentModalDivOnClick(e) {
    return e.stopPropagation();
}
var _c;
__turbopack_context__.k.register(_c, "AssessmentModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/vocabulary/QuickSearchModal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>QuickSearchModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
function QuickSearchModal({ isOpen, onClose, searchText, onSearchChange, results, isSearching, onSelect, onCreate, hasExactMatch, searchInputRef, handleSpeak, handleOpenAssessment, triggerInteraction }) {
    _s();
    const [translation, setTranslation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [pronunciation, setPronunciation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [partOfSpeech, setPartOfSpeech] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [isTranslating, setIsTranslating] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Auto translate when search text changes and no exact match
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "QuickSearchModal.useEffect": ()=>{
            if (isOpen && searchInputRef.current) {
                setTimeout({
                    "QuickSearchModal.useEffect": ()=>searchInputRef.current?.focus()
                }["QuickSearchModal.useEffect"], 100);
            }
        }
    }["QuickSearchModal.useEffect"], [
        isOpen,
        searchInputRef
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "QuickSearchModal.useEffect": ()=>{
            const fetchTranslation = {
                "QuickSearchModal.useEffect.fetchTranslation": async ()=>{
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
                        const dictPromise = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`https://api.dictionaryapi.dev/api/v2/entries/en/${searchText}`).catch({
                            "QuickSearchModal.useEffect.fetchTranslation.dictPromise": ()=>null
                        }["QuickSearchModal.useEffect.fetchTranslation.dictPromise"]);
                        const translatePromise = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(searchText)}`).catch({
                            "QuickSearchModal.useEffect.fetchTranslation.translatePromise": ()=>null
                        }["QuickSearchModal.useEffect.fetchTranslation.translatePromise"]);
                        const [dictRes, transRes] = await Promise.all([
                            dictPromise,
                            translatePromise
                        ]);
                        // Xử lý dictionary data
                        if (dictRes && dictRes.data && dictRes.data[0]) {
                            const entry = dictRes.data[0];
                            // Pronunciation
                            if (entry.phonetic) {
                                setPronunciation(entry.phonetic);
                            } else if (entry.phonetics && entry.phonetics.length > 0) {
                                const p = entry.phonetics.find({
                                    "QuickSearchModal.useEffect.fetchTranslation.p": (x)=>x.text && x.audio
                                }["QuickSearchModal.useEffect.fetchTranslation.p"]);
                                setPronunciation(p ? p.text : entry.phonetics[0].text || "");
                            }
                            // Part of Speech
                            if (entry.meanings && entry.meanings.length > 0) {
                                setPartOfSpeech(entry.meanings[0].partOfSpeech || "");
                            }
                        }
                        // Xử lý translation
                        if (transRes && transRes.data && transRes.data[0]) {
                            const translatedText = transRes.data[0].map({
                                "QuickSearchModal.useEffect.fetchTranslation.translatedText": (item)=>item[0]
                            }["QuickSearchModal.useEffect.fetchTranslation.translatedText"]).join("");
                            setTranslation(translatedText);
                        }
                    } catch (error) {
                        console.error("Translation error:", error);
                        setTranslation("");
                        setPronunciation("");
                        setPartOfSpeech("");
                    } finally{
                        setIsTranslating(false);
                    }
                }
            }["QuickSearchModal.useEffect.fetchTranslation"];
            const debounceTimer = setTimeout({
                "QuickSearchModal.useEffect.debounceTimer": ()=>{
                    fetchTranslation();
                }
            }["QuickSearchModal.useEffect.debounceTimer"], 500);
            return ({
                "QuickSearchModal.useEffect": ()=>clearTimeout(debounceTimer)
            })["QuickSearchModal.useEffect"];
        }
    }["QuickSearchModal.useEffect"], [
        searchText,
        hasExactMatch
    ]);
    if (!isOpen) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-[100] flex items-start justify-center pt-20",
        onClick: onClose,
        style: {
            backgroundColor: 'transparent'
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col mx-4 border border-gray-100",
            onClick: (e)=>e.stopPropagation(),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "p-4 border-b border-gray-100 flex items-center gap-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-xl",
                            children: "🔍"
                        }, void 0, false, {
                            fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                            lineNumber: 106,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            ref: searchInputRef,
                            type: "text",
                            value: searchText,
                            onChange: onSearchChange,
                            onKeyDown: (e_0)=>{
                                if (e_0.key === "Enter" && results.length === 0 && !hasExactMatch) {
                                    onCreate();
                                }
                            },
                            placeholder: "Type to search or create...",
                            className: "flex-1 text-xl font-light outline-none bg-transparent h-10"
                        }, void 0, false, {
                            fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                            lineNumber: 107,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-xs text-gray-400 border border-gray-200 px-2 py-1 rounded",
                            children: "ESC to close"
                        }, void 0, false, {
                            fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                            lineNumber: 112,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                    lineNumber: 105,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-gray-50 max-h-[60vh] overflow-y-auto",
                    children: isSearching ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-8 text-center text-gray-400",
                        children: "Searching..."
                    }, void 0, false, {
                        fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                        lineNumber: 118,
                        columnNumber: 26
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            searchText && !hasExactMatch && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "p-4 space-y-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-2 flex-wrap",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-2xl font-bold text-gray-800",
                                                    children: searchText
                                                }, void 0, false, {
                                                    fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                                    lineNumber: 124,
                                                    columnNumber: 23
                                                }, this),
                                                pronunciation && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-sm text-gray-600 font-mono bg-white px-2 py-1 rounded border border-gray-200",
                                                    children: pronunciation
                                                }, void 0, false, {
                                                    fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                                    lineNumber: 129,
                                                    columnNumber: 41
                                                }, this),
                                                partOfSpeech && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-[10px] uppercase font-bold text-indigo-600 bg-indigo-100 border border-indigo-200 px-2 py-1 rounded",
                                                    children: partOfSpeech
                                                }, void 0, false, {
                                                    fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                                    lineNumber: 134,
                                                    columnNumber: 40
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: (e_1)=>{
                                                        e_1.stopPropagation();
                                                        handleSpeak(searchText, e_1);
                                                    },
                                                    className: "p-2 hover:bg-blue-100 rounded-full transition-colors",
                                                    title: "Play pronunciation",
                                                    children: "🔊"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                                    lineNumber: 138,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: (e_2)=>{
                                                        e_2.stopPropagation();
                                                        handleOpenAssessment({
                                                            id: 'temp',
                                                            word: searchText,
                                                            // userId: '',
                                                            createdAt: new Date().toISOString(),
                                                            updatedAt: new Date().toISOString(),
                                                            occurrence: 0,
                                                            isStarred: false,
                                                            pronunciationScores: []
                                                        }, e_2);
                                                    },
                                                    className: "p-2 hover:bg-green-100 rounded-full transition-colors",
                                                    title: "Test pronunciation",
                                                    children: "🎤"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                                    lineNumber: 144,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                            lineNumber: 123,
                                            columnNumber: 21
                                        }, this),
                                        isTranslating ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-sm text-gray-500 italic animate-pulse",
                                            children: "Loading..."
                                        }, void 0, false, {
                                            fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                            lineNumber: 162,
                                            columnNumber: 38
                                        }, this) : translation ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-white rounded-lg p-3 border border-blue-200",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-xs text-gray-500 mb-1",
                                                    children: "🌐 Google Translate"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                                    lineNumber: 165,
                                                    columnNumber: 25
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-base text-gray-800 font-medium",
                                                    children: translation
                                                }, void 0, false, {
                                                    fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                                    lineNumber: 168,
                                                    columnNumber: 25
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                            lineNumber: 164,
                                            columnNumber: 46
                                        }, this) : null
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                    lineNumber: 121,
                                    columnNumber: 19
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                lineNumber: 120,
                                columnNumber: 48
                            }, this),
                            searchText && !hasExactMatch && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center group cursor-pointer hover:bg-indigo-100 transition-colors",
                                onClick: onCreate,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "w-10 h-10 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xl",
                                                children: "+"
                                            }, void 0, false, {
                                                fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                                lineNumber: 178,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "font-bold text-indigo-800",
                                                        children: [
                                                            'Create "',
                                                            searchText,
                                                            '"'
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                                        lineNumber: 182,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-xs text-indigo-500",
                                                        children: "Auto-fill meaning & pronunciation"
                                                    }, void 0, false, {
                                                        fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                                        lineNumber: 185,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                                lineNumber: 181,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                        lineNumber: 177,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-sm font-semibold text-indigo-600 bg-white px-3 py-1 rounded-full shadow-sm",
                                        children: "Enter ↵"
                                    }, void 0, false, {
                                        fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                        lineNumber: 190,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                lineNumber: 176,
                                columnNumber: 48
                            }, this),
                            results.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                className: "divide-y divide-gray-100",
                                children: results.map((item_0)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        onClick: ()=>{
                                            triggerInteraction(item_0);
                                            onSelect(item_0);
                                        },
                                        className: "p-3 hover:bg-indigo-50 cursor-pointer transition-colors group",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex justify-between items-start gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex-1",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex items-center gap-2 mb-1",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "font-bold text-lg text-indigo-700",
                                                                    children: item_0.word
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                                                    lineNumber: 204,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    onClick: (e_3)=>{
                                                                        e_3.stopPropagation();
                                                                        handleOpenAssessment(item_0, e_3);
                                                                    },
                                                                    className: "text-gray-400 hover:text-green-600 p-1 rounded-full hover:bg-green-100",
                                                                    children: "🎤"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                                                    lineNumber: 209,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    onClick: (e_4)=>{
                                                                        e_4.stopPropagation();
                                                                        handleSpeak(item_0.word, e_4);
                                                                    },
                                                                    className: "text-gray-400 hover:text-indigo-600 p-1 rounded-full hover:bg-indigo-100",
                                                                    children: "🔊"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                                                    lineNumber: 215,
                                                                    columnNumber: 29
                                                                }, this),
                                                                item_0.partOfSpeech && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-[10px] uppercase font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded",
                                                                    children: item_0.partOfSpeech
                                                                }, void 0, false, {
                                                                    fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                                                    lineNumber: 222,
                                                                    columnNumber: 53
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                                            lineNumber: 203,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-sm text-gray-800 line-clamp-2",
                                                            children: item_0.meaning || /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "italic text-gray-400",
                                                                children: "No meaning"
                                                            }, void 0, false, {
                                                                fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                                                lineNumber: 227,
                                                                columnNumber: 48
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                                            lineNumber: 226,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                                    lineNumber: 202,
                                                    columnNumber: 25
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-right shrink-0 flex flex-col items-end gap-1",
                                                    children: [
                                                        item_0.topic && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full",
                                                            children: item_0.topic
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                                            lineNumber: 233,
                                                            columnNumber: 44
                                                        }, this),
                                                        item_0.isStarred && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-yellow-400 text-xs",
                                                            children: "★"
                                                        }, void 0, false, {
                                                            fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                                            lineNumber: 236,
                                                            columnNumber: 48
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                                    lineNumber: 232,
                                                    columnNumber: 25
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                            lineNumber: 201,
                                            columnNumber: 23
                                        }, this)
                                    }, item_0.id, false, {
                                        fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                        lineNumber: 197,
                                        columnNumber: 42
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                lineNumber: 196,
                                columnNumber: 37
                            }, this) : !hasExactMatch && searchText && !translation && !isTranslating && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-4 text-center text-gray-400 text-sm",
                                children: "No existing words match."
                            }, void 0, false, {
                                fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                                lineNumber: 240,
                                columnNumber: 91
                            }, this)
                        ]
                    }, void 0, true)
                }, void 0, false, {
                    fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
                    lineNumber: 117,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
            lineNumber: 104,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/vocabulary/QuickSearchModal.tsx",
        lineNumber: 101,
        columnNumber: 10
    }, this);
}
_s(QuickSearchModal, "2M0xEjJDP9OijpuoVLAis4hzp9Q=");
_c = QuickSearchModal;
var _c;
__turbopack_context__.k.register(_c, "QuickSearchModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/vocabulary/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>VocabularyPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/contexts/AuthContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$vocabulary$2f$useVocabData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/hooks/vocabulary/useVocabData.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$vocabulary$2f$useVocabModals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/hooks/vocabulary/useVocabModals.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$vocabulary$2f$usePronunciationAssessment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/hooks/vocabulary/usePronunciationAssessment.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$vocabulary$2f$useQuickSearch$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/hooks/vocabulary/useQuickSearch.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$vocabulary$2f$VocabTable$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/vocabulary/VocabTable.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$vocabulary$2f$VocabFormModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/vocabulary/VocabFormModal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$vocabulary$2f$AssessmentModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/vocabulary/AssessmentModal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$vocabulary$2f$QuickSearchModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/vocabulary/QuickSearchModal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Icons.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
;
;
;
;
function VocabularyContent() {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(110);
    if ($[0] !== "5abad0d8acf0256cd0067b35b2f19243142b3e226a85377bbc6f1b0c9d079413") {
        for(let $i = 0; $i < 110; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "5abad0d8acf0256cd0067b35b2f19243142b3e226a85377bbc6f1b0c9d079413";
    }
    const { token, isLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"])();
    let t0;
    if ($[1] !== searchParams) {
        t0 = searchParams.get("iframeMode");
        $[1] = searchParams;
        $[2] = t0;
    } else {
        t0 = $[2];
    }
    const isIframeMode = t0 === "true";
    const { vocabs, loading, page, setPage, totalPages, showStarredOnly, setShowStarredOnly, filters, sortConfig, columnOrder, draggedCol, fetchVocabs, handleFilterChange, handleSort, handleToggleStar, triggerInteraction, handleDragStart, handleDragOver, handleDragEnd } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$vocabulary$2f$useVocabData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(token);
    let t1;
    if ($[3] !== fetchVocabs || $[4] !== page) {
        t1 = ({
            "VocabularyContent[useVocabModals()]": ()=>fetchVocabs(page)
        })["VocabularyContent[useVocabModals()]"];
        $[3] = fetchVocabs;
        $[4] = page;
        $[5] = t1;
    } else {
        t1 = $[5];
    }
    const { selectedVocab, isModalOpen, setIsModalOpen, isAutoFilling, formData, setFormData, fileInputRef, isUploading, handleRowClick, handleOpenCreateModal, handleSave, handleDelete, handleFileChange, fetchAutoFillData } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$vocabulary$2f$useVocabModals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(token, t1);
    let t2;
    if ($[6] !== fetchVocabs || $[7] !== page) {
        t2 = ({
            "VocabularyContent[usePronunciationAssessment()]": ()=>fetchVocabs(page)
        })["VocabularyContent[usePronunciationAssessment()]"];
        $[6] = fetchVocabs;
        $[7] = page;
        $[8] = t2;
    } else {
        t2 = $[8];
    }
    const { isAssessmentModalOpen, setIsAssessmentModalOpen, recordingVocabItem, isRecording, assessmentResult, assessmentError, isProcessingAudio, userAudioUrl, startRecording, stopRecording, handleOpenAssessment, handleSpeak } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$vocabulary$2f$usePronunciationAssessment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(token, t2, page);
    const { showSearch, setShowSearch, quickSearchText, quickSearchResults, isSearching, searchInputRef, hasExactMatch, handleQuickSearchChange } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$vocabulary$2f$useQuickSearch$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(token, handleOpenCreateModal);
    let t3;
    let t4;
    if ($[9] !== isIframeMode || $[10] !== setIsAssessmentModalOpen || $[11] !== setIsModalOpen || $[12] !== setShowSearch) {
        t3 = ({
            "VocabularyContent[useEffect()]": ()=>{
                const handleKeyDown = {
                    "VocabularyContent[useEffect() > handleKeyDown]": (e)=>{
                        if (e.code === "Escape") {
                            if (isIframeMode) {
                                window.parent.postMessage("CLOSE_EXTENSION_IFRAME", "*");
                            }
                            setShowSearch(false);
                            setIsModalOpen(false);
                            setIsAssessmentModalOpen(false);
                        }
                    }
                }["VocabularyContent[useEffect() > handleKeyDown]"];
                window.addEventListener("keydown", handleKeyDown);
                return ()=>window.removeEventListener("keydown", handleKeyDown);
            }
        })["VocabularyContent[useEffect()]"];
        t4 = [
            setIsAssessmentModalOpen,
            setIsModalOpen,
            setShowSearch,
            isIframeMode
        ];
        $[9] = isIframeMode;
        $[10] = setIsAssessmentModalOpen;
        $[11] = setIsModalOpen;
        $[12] = setShowSearch;
        $[13] = t3;
        $[14] = t4;
    } else {
        t3 = $[13];
        t4 = $[14];
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])(t3, t4);
    let t5;
    let t6;
    if ($[15] !== isLoading || $[16] !== router || $[17] !== token) {
        t5 = ({
            "VocabularyContent[useEffect()]": ()=>{
                if (!isLoading && !token) {
                    router.push("/login");
                }
            }
        })["VocabularyContent[useEffect()]"];
        t6 = [
            token,
            isLoading,
            router
        ];
        $[15] = isLoading;
        $[16] = router;
        $[17] = token;
        $[18] = t5;
        $[19] = t6;
    } else {
        t5 = $[18];
        t6 = $[19];
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])(t5, t6);
    if (isLoading) {
        let t7;
        if ($[20] === Symbol.for("react.memo_cache_sentinel")) {
            t7 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "min-h-screen bg-gray-50 flex items-center justify-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"
                        }, void 0, false, {
                            fileName: "[project]/app/vocabulary/page.tsx",
                            lineNumber: 179,
                            columnNumber: 115
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-600",
                            children: "Loading..."
                        }, void 0, false, {
                            fileName: "[project]/app/vocabulary/page.tsx",
                            lineNumber: 179,
                            columnNumber: 212
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/vocabulary/page.tsx",
                    lineNumber: 179,
                    columnNumber: 86
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/vocabulary/page.tsx",
                lineNumber: 179,
                columnNumber: 12
            }, this);
            $[20] = t7;
        } else {
            t7 = $[20];
        }
        return t7;
    }
    if (!token) {
        return null;
    }
    const t7 = `min-h-screen ${isIframeMode ? "bg-transparent" : "bg-gray-50"} p-6 text-black relative`;
    let t8;
    if ($[21] !== setIsAssessmentModalOpen) {
        t8 = ({
            "VocabularyContent[<AssessmentModal>.onClose]": ()=>setIsAssessmentModalOpen(false)
        })["VocabularyContent[<AssessmentModal>.onClose]"];
        $[21] = setIsAssessmentModalOpen;
        $[22] = t8;
    } else {
        t8 = $[22];
    }
    let t9;
    if ($[23] !== assessmentError || $[24] !== assessmentResult || $[25] !== handleSpeak || $[26] !== isAssessmentModalOpen || $[27] !== isProcessingAudio || $[28] !== isRecording || $[29] !== recordingVocabItem || $[30] !== startRecording || $[31] !== stopRecording || $[32] !== t8 || $[33] !== userAudioUrl) {
        t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$vocabulary$2f$AssessmentModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            isOpen: isAssessmentModalOpen,
            onClose: t8,
            vocabItem: recordingVocabItem,
            isRecording: isRecording,
            assessmentResult: assessmentResult,
            assessmentError: assessmentError,
            isProcessingAudio: isProcessingAudio,
            userAudioUrl: userAudioUrl,
            startRecording: startRecording,
            stopRecording: stopRecording,
            handleSpeak: handleSpeak
        }, void 0, false, {
            fileName: "[project]/app/vocabulary/page.tsx",
            lineNumber: 202,
            columnNumber: 10
        }, this);
        $[23] = assessmentError;
        $[24] = assessmentResult;
        $[25] = handleSpeak;
        $[26] = isAssessmentModalOpen;
        $[27] = isProcessingAudio;
        $[28] = isRecording;
        $[29] = recordingVocabItem;
        $[30] = startRecording;
        $[31] = stopRecording;
        $[32] = t8;
        $[33] = userAudioUrl;
        $[34] = t9;
    } else {
        t9 = $[34];
    }
    let t10;
    if ($[35] !== isIframeMode || $[36] !== setShowSearch) {
        t10 = ({
            "VocabularyContent[<QuickSearchModal>.onClose]": ()=>{
                setShowSearch(false);
                if (isIframeMode) {
                    window.parent.postMessage("CLOSE_EXTENSION_IFRAME", "*");
                }
            }
        })["VocabularyContent[<QuickSearchModal>.onClose]"];
        $[35] = isIframeMode;
        $[36] = setShowSearch;
        $[37] = t10;
    } else {
        t10 = $[37];
    }
    let t11;
    if ($[38] !== handleRowClick || $[39] !== setShowSearch) {
        t11 = ({
            "VocabularyContent[<QuickSearchModal>.onSelect]": (vocab)=>{
                setShowSearch(false);
                handleRowClick(vocab);
            }
        })["VocabularyContent[<QuickSearchModal>.onSelect]"];
        $[38] = handleRowClick;
        $[39] = setShowSearch;
        $[40] = t11;
    } else {
        t11 = $[40];
    }
    let t12;
    if ($[41] !== handleOpenCreateModal || $[42] !== quickSearchText) {
        t12 = ({
            "VocabularyContent[<QuickSearchModal>.onCreate]": ()=>handleOpenCreateModal(quickSearchText)
        })["VocabularyContent[<QuickSearchModal>.onCreate]"];
        $[41] = handleOpenCreateModal;
        $[42] = quickSearchText;
        $[43] = t12;
    } else {
        t12 = $[43];
    }
    const t13 = searchInputRef;
    let t14;
    if ($[44] !== handleOpenAssessment || $[45] !== handleQuickSearchChange || $[46] !== handleSpeak || $[47] !== hasExactMatch || $[48] !== isSearching || $[49] !== quickSearchResults || $[50] !== quickSearchText || $[51] !== showSearch || $[52] !== t10 || $[53] !== t11 || $[54] !== t12 || $[55] !== t13 || $[56] !== triggerInteraction) {
        t14 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$vocabulary$2f$QuickSearchModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            isOpen: showSearch,
            onClose: t10,
            searchText: quickSearchText,
            onSearchChange: handleQuickSearchChange,
            results: quickSearchResults,
            isSearching: isSearching,
            onSelect: t11,
            onCreate: t12,
            hasExactMatch: hasExactMatch,
            searchInputRef: t13,
            handleSpeak: handleSpeak,
            handleOpenAssessment: handleOpenAssessment,
            triggerInteraction: triggerInteraction
        }, void 0, false, {
            fileName: "[project]/app/vocabulary/page.tsx",
            lineNumber: 262,
            columnNumber: 11
        }, this);
        $[44] = handleOpenAssessment;
        $[45] = handleQuickSearchChange;
        $[46] = handleSpeak;
        $[47] = hasExactMatch;
        $[48] = isSearching;
        $[49] = quickSearchResults;
        $[50] = quickSearchText;
        $[51] = showSearch;
        $[52] = t10;
        $[53] = t11;
        $[54] = t12;
        $[55] = t13;
        $[56] = triggerInteraction;
        $[57] = t14;
    } else {
        t14 = $[57];
    }
    let t15;
    if ($[58] !== setIsModalOpen) {
        t15 = ({
            "VocabularyContent[<VocabFormModal>.onClose]": ()=>setIsModalOpen(false)
        })["VocabularyContent[<VocabFormModal>.onClose]"];
        $[58] = setIsModalOpen;
        $[59] = t15;
    } else {
        t15 = $[59];
    }
    const t16 = !!selectedVocab;
    let t17;
    if ($[60] !== handleDelete || $[61] !== selectedVocab) {
        t17 = ({
            "VocabularyContent[<VocabFormModal>.onDelete]": ()=>selectedVocab && handleDelete(selectedVocab.id)
        })["VocabularyContent[<VocabFormModal>.onDelete]"];
        $[60] = handleDelete;
        $[61] = selectedVocab;
        $[62] = t17;
    } else {
        t17 = $[62];
    }
    let t18;
    if ($[63] !== fetchAutoFillData || $[64] !== formData || $[65] !== handleOpenAssessment || $[66] !== handleSave || $[67] !== handleSpeak || $[68] !== isAutoFilling || $[69] !== isModalOpen || $[70] !== selectedVocab || $[71] !== setFormData || $[72] !== t15 || $[73] !== t16 || $[74] !== t17) {
        t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$vocabulary$2f$VocabFormModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            isOpen: isModalOpen,
            onClose: t15,
            initialData: formData,
            setInitialData: setFormData,
            isEditMode: t16,
            onSave: handleSave,
            onDelete: t17,
            isAutoFilling: isAutoFilling,
            fetchAutoFillData: fetchAutoFillData,
            handleOpenAssessment: handleOpenAssessment,
            handleSpeak: handleSpeak,
            selectedVocab: selectedVocab
        }, void 0, false, {
            fileName: "[project]/app/vocabulary/page.tsx",
            lineNumber: 304,
            columnNumber: 11
        }, this);
        $[63] = fetchAutoFillData;
        $[64] = formData;
        $[65] = handleOpenAssessment;
        $[66] = handleSave;
        $[67] = handleSpeak;
        $[68] = isAutoFilling;
        $[69] = isModalOpen;
        $[70] = selectedVocab;
        $[71] = setFormData;
        $[72] = t15;
        $[73] = t16;
        $[74] = t17;
        $[75] = t18;
    } else {
        t18 = $[75];
    }
    let t19;
    if ($[76] !== columnOrder || $[77] !== draggedCol || $[78] !== fetchVocabs || $[79] !== fileInputRef || $[80] !== filters || $[81] !== handleDragEnd || $[82] !== handleDragOver || $[83] !== handleDragStart || $[84] !== handleFileChange || $[85] !== handleFilterChange || $[86] !== handleOpenAssessment || $[87] !== handleOpenCreateModal || $[88] !== handleRowClick || $[89] !== handleSort || $[90] !== handleSpeak || $[91] !== handleToggleStar || $[92] !== isIframeMode || $[93] !== isUploading || $[94] !== loading || $[95] !== page || $[96] !== setPage || $[97] !== setShowStarredOnly || $[98] !== showStarredOnly || $[99] !== sortConfig || $[100] !== totalPages || $[101] !== triggerInteraction || $[102] !== vocabs) {
        t19 = isIframeMode ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-center h-screen",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-gray-400 text-sm"
            }, void 0, false, {
                fileName: "[project]/app/vocabulary/page.tsx",
                lineNumber: 323,
                columnNumber: 85
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/vocabulary/page.tsx",
            lineNumber: 323,
            columnNumber: 26
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col md:flex-row justify-between items-center mb-6 gap-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    className: "text-3xl font-bold text-gray-800",
                                    children: "My Vocabulary"
                                }, void 0, false, {
                                    fileName: "[project]/app/vocabulary/page.tsx",
                                    lineNumber: 323,
                                    columnNumber: 225
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-gray-500 text-sm mt-1",
                                    children: [
                                        "Double-tap",
                                        " ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("kbd", {
                                            className: "bg-gray-200 px-1.5 py-0.5 rounded text-xs border border-gray-300 font-mono",
                                            children: "Space"
                                        }, void 0, false, {
                                            fileName: "[project]/app/vocabulary/page.tsx",
                                            lineNumber: 323,
                                            columnNumber: 349
                                        }, this),
                                        " ",
                                        "to Quick Search / Create"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/vocabulary/page.tsx",
                                    lineNumber: 323,
                                    columnNumber: 292
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/vocabulary/page.tsx",
                            lineNumber: 323,
                            columnNumber: 220
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex gap-2 items-center",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: {
                                        "VocabularyContent[<button>.onClick]": ()=>handleOpenCreateModal("")
                                    }["VocabularyContent[<button>.onClick]"],
                                    className: "bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 font-medium",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: "+"
                                        }, void 0, false, {
                                            fileName: "[project]/app/vocabulary/page.tsx",
                                            lineNumber: 325,
                                            columnNumber: 174
                                        }, this),
                                        " New Word"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/vocabulary/page.tsx",
                                    lineNumber: 323,
                                    columnNumber: 532
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: {
                                        "VocabularyContent[<button>.onClick]": ()=>{
                                            const newValue = !showStarredOnly;
                                            setShowStarredOnly(newValue);
                                            fetchVocabs(1, filters, sortConfig, newValue);
                                        }
                                    }["VocabularyContent[<button>.onClick]"],
                                    className: `px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${showStarredOnly ? "bg-yellow-50 border-yellow-400 text-yellow-700" : "bg-white border-gray-300 text-gray-600"}`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StarIcon"], {
                                            filled: showStarredOnly,
                                            className: showStarredOnly ? "text-yellow-500" : "text-gray-400"
                                        }, void 0, false, {
                                            fileName: "[project]/app/vocabulary/page.tsx",
                                            lineNumber: 331,
                                            columnNumber: 250
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-sm font-medium",
                                            children: showStarredOnly ? "Starred" : "All"
                                        }, void 0, false, {
                                            fileName: "[project]/app/vocabulary/page.tsx",
                                            lineNumber: 331,
                                            columnNumber: 353
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/vocabulary/page.tsx",
                                    lineNumber: 325,
                                    columnNumber: 206
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "file",
                                    ref: fileInputRef,
                                    onChange: handleFileChange,
                                    accept: ".csv",
                                    className: "hidden"
                                }, void 0, false, {
                                    fileName: "[project]/app/vocabulary/page.tsx",
                                    lineNumber: 331,
                                    columnNumber: 444
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: {
                                        "VocabularyContent[<button>.onClick]": ()=>fileInputRef.current?.click()
                                    }["VocabularyContent[<button>.onClick]"],
                                    disabled: isUploading,
                                    className: "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 text-sm font-medium",
                                    children: isUploading ? "..." : "\uD83D\uDCC2 CSV"
                                }, void 0, false, {
                                    fileName: "[project]/app/vocabulary/page.tsx",
                                    lineNumber: 331,
                                    columnNumber: 545
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/vocabulary/page.tsx",
                            lineNumber: 323,
                            columnNumber: 491
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/vocabulary/page.tsx",
                    lineNumber: 323,
                    columnNumber: 137
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$vocabulary$2f$VocabTable$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    vocabs: vocabs,
                    loading: loading,
                    columnOrder: columnOrder,
                    draggedCol: draggedCol,
                    sortConfig: sortConfig,
                    filters: filters,
                    page: page,
                    totalPages: totalPages,
                    handleDragStart: handleDragStart,
                    handleDragOver: handleDragOver,
                    handleDragEnd: handleDragEnd,
                    handleSort: handleSort,
                    handleFilterChange: handleFilterChange,
                    handleRowClick: handleRowClick,
                    handleToggleStar: handleToggleStar,
                    handleOpenAssessment: handleOpenAssessment,
                    handleSpeak: handleSpeak,
                    triggerInteraction: triggerInteraction,
                    fetchVocabs: fetchVocabs,
                    setPage: setPage
                }, void 0, false, {
                    fileName: "[project]/app/vocabulary/page.tsx",
                    lineNumber: 333,
                    columnNumber: 266
                }, this)
            ]
        }, void 0, true);
        $[76] = columnOrder;
        $[77] = draggedCol;
        $[78] = fetchVocabs;
        $[79] = fileInputRef;
        $[80] = filters;
        $[81] = handleDragEnd;
        $[82] = handleDragOver;
        $[83] = handleDragStart;
        $[84] = handleFileChange;
        $[85] = handleFilterChange;
        $[86] = handleOpenAssessment;
        $[87] = handleOpenCreateModal;
        $[88] = handleRowClick;
        $[89] = handleSort;
        $[90] = handleSpeak;
        $[91] = handleToggleStar;
        $[92] = isIframeMode;
        $[93] = isUploading;
        $[94] = loading;
        $[95] = page;
        $[96] = setPage;
        $[97] = setShowStarredOnly;
        $[98] = showStarredOnly;
        $[99] = sortConfig;
        $[100] = totalPages;
        $[101] = triggerInteraction;
        $[102] = vocabs;
        $[103] = t19;
    } else {
        t19 = $[103];
    }
    let t20;
    if ($[104] !== t14 || $[105] !== t18 || $[106] !== t19 || $[107] !== t7 || $[108] !== t9) {
        t20 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: t7,
            children: [
                t9,
                t14,
                t18,
                t19
            ]
        }, void 0, true, {
            fileName: "[project]/app/vocabulary/page.tsx",
            lineNumber: 367,
            columnNumber: 11
        }, this);
        $[104] = t14;
        $[105] = t18;
        $[106] = t19;
        $[107] = t7;
        $[108] = t9;
        $[109] = t20;
    } else {
        t20 = $[109];
    }
    return t20;
}
_s(VocabularyContent, "U1Zpe4EB/QPN5cxUN4SGr8t6zXs=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$vocabulary$2f$useVocabData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"],
        __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$vocabulary$2f$useVocabModals$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"],
        __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$vocabulary$2f$usePronunciationAssessment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"],
        __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$vocabulary$2f$useQuickSearch$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
    ];
});
_c = VocabularyContent;
function VocabularyPage() {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(2);
    if ($[0] !== "5abad0d8acf0256cd0067b35b2f19243142b3e226a85377bbc6f1b0c9d079413") {
        for(let $i = 0; $i < 2; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "5abad0d8acf0256cd0067b35b2f19243142b3e226a85377bbc6f1b0c9d079413";
    }
    let t0;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Suspense"], {
            fallback: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "p-4 text-center",
                children: "Loading vocabulary..."
            }, void 0, false, {
                fileName: "[project]/app/vocabulary/page.tsx",
                lineNumber: 391,
                columnNumber: 30
            }, void 0),
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(VocabularyContent, {}, void 0, false, {
                fileName: "[project]/app/vocabulary/page.tsx",
                lineNumber: 391,
                columnNumber: 92
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/vocabulary/page.tsx",
            lineNumber: 391,
            columnNumber: 10
        }, this);
        $[1] = t0;
    } else {
        t0 = $[1];
    }
    return t0;
}
_c1 = VocabularyPage;
var _c, _c1;
__turbopack_context__.k.register(_c, "VocabularyContent");
__turbopack_context__.k.register(_c1, "VocabularyPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_e3d569cc._.js.map