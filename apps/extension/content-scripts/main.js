// ==========================================
// MODULE: UI MANAGER - DRAGGABLE IFRAME WITH POSITION PERSISTENCE
// ==========================================
const UI = (() => {
  let iframe = null;
  let overlay = null;
  let container = null;
  let dragHandle = null;
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  // Storage keys
  const POSITION_STORAGE_KEY = "vocab-iframe-position";

  // Load saved position from localStorage
  function loadPosition() {
    try {
      const saved = localStorage.getItem(POSITION_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load iframe position:", e);
    }
    // Default position (center)
    return null;
  }

  // Save current position to localStorage
  function savePosition() {
    if (!container) return;

    try {
      const rect = container.getBoundingClientRect();
      const position = {
        left: rect.left,
        top: rect.top,
      };
      localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
    } catch (e) {
      console.error("Failed to save iframe position:", e);
    }
  }

  function create() {
    if (container) return;

    // Tạo overlay trong suốt để bắt sự kiện drag
    overlay = document.createElement("div");
    overlay.id = "vocab-drag-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2147483646;
      display: none;
      cursor: grabbing;
    `;
    document.body.appendChild(overlay);

    // Tạo container để chứa drag handle và iframe
    container = document.createElement("div");
    container.id = "vocab-container";

    // Load saved position
    const savedPosition = loadPosition();

    if (savedPosition) {
      // Restore saved position
      Object.assign(container.style, {
        position: "fixed",
        left: `${savedPosition.left}px`,
        top: `${savedPosition.top}px`,
        zIndex: "2147483647",
        margin: "0",
        padding: "0",
      });
    } else {
      // Default centered position
      Object.assign(container.style, {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: "2147483647",
        margin: "0",
        padding: "0",
      });
    }

    // Tạo drag handle (gắn vào đầu search box)
    dragHandle = document.createElement("div");
    dragHandle.id = "vocab-drag-handle";
    dragHandle.textContent = "⋮⋮ Drag to move";
    Object.assign(dragHandle.style, {
      width: "500px",
      height: "32px",
      backgroundColor: "#f3f4f6",
      color: "#6366f1",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "grab",
      fontSize: "10px",
      fontWeight: "600",
      fontFamily: "system-ui, -apple-system, sans-serif",
      userSelect: "none",
      margin: "0",
      padding: "0",
      borderTopLeftRadius: "16px",
      borderTopRightRadius: "16px",
      borderBottom: "1px solid #e5e7eb",
    });

    // Tạo iframe
    iframe = document.createElement("iframe");
    iframe.id = "vocab-quick-search-iframe";
    Object.assign(iframe.style, {
      width: "500px",
      height: "600px",
      border: "none",
      backgroundColor: "transparent",
      overflow: "hidden",
      display: "block",
      margin: "0",
      padding: "0",
      pointerEvents: "auto",
      borderBottomLeftRadius: "16px",
      borderBottomRightRadius: "16px",
    });

    iframe.src =
      "https://localhost:3001/vocabulary?openSearch=true&iframeMode=true";
    iframe.allow = "microphone *; camera *; clipboard-write";
    iframe.scrolling = "no";

    // Append elements
    container.appendChild(dragHandle);
    container.appendChild(iframe);
    document.body.appendChild(container);

    // Bắt sự kiện drag
    dragHandle.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // Focus vào iframe
    iframe.onload = () => iframe.contentWindow.focus();
  }

  function handleMouseDown(e) {
    // Chỉ drag khi click chuột trái
    if (e.button !== 0) return;

    isDragging = true;

    const rect = container.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;

    dragHandle.style.cursor = "grabbing";

    // Disable pointer events on iframe during drag to prevent lag
    iframe.style.pointerEvents = "none";

    e.preventDefault();
    e.stopPropagation();
  }

  function handleMouseMove(e) {
    if (!isDragging) return;

    e.preventDefault();
    e.stopPropagation();

    const x = e.clientX - dragOffsetX;
    const y = e.clientY - dragOffsetY;

    // Use requestAnimationFrame for smooth movement
    requestAnimationFrame(() => {
      container.style.left = x + "px";
      container.style.top = y + "px";
      container.style.transform = "none";
    });
  }

  function handleMouseUp() {
    if (!isDragging) return;

    isDragging = false;
    dragHandle.style.cursor = "grab";

    // Re-enable pointer events on iframe
    iframe.style.pointerEvents = "auto";

    // Save position when drag ends
    savePosition();
  }

  function remove() {
    if (container) {
      // Save final position before removing
      savePosition();

      dragHandle.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      container.remove();
      container = null;
      iframe = null;
      dragHandle = null;
    }
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
    isDragging = false;
  }

  function toggle() {
    container ? remove() : create();
  }

  return { create, remove, toggle };
})();

// ==========================================
// MODULE: SHORTCUT LISTENER
// ==========================================
window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.code === "KeyQ") {
    e.preventDefault();
    UI.toggle();
  }
});

// ==========================================
// MODULE: MESSAGE LISTENER (From Iframe)
// ==========================================
window.addEventListener("message", (event) => {
  if (event.origin !== "https://localhost:3001") return;

  if (event.data === "CLOSE_EXTENSION_IFRAME") {
    UI.remove();
  }
});

console.log("✅ Vocab Quick Search Loaded: Press Ctrl+Q!");
