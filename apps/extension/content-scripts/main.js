// ==========================================
// MODULE: UI MANAGER - QUICK SEARCH IFRAME
// ==========================================
const UI = (() => {
  let iframe = null;

  function create() {
    if (iframe) return;

    iframe = document.createElement("iframe");
    iframe.id = "vocab-quick-search-iframe";

    // Style: Giữa màn hình, nền trong suốt
    Object.assign(iframe.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "500px",
      height: "600px",
      border: "none",
      boxShadow: "none",
      zIndex: "2147483647",
      backgroundColor: "transparent",
      overflow: "hidden",
      pointerEvents: "auto",
    });

    iframe.src =
      "https://localhost:3001/vocabulary?openSearch=true&iframeMode=true";
    iframe.allow = "microphone *; camera *; clipboard-write";
    iframe.scrolling = "no";

    document.body.appendChild(iframe);

    // Focus vào iframe
    iframe.onload = () => iframe.contentWindow.focus();
  }

  function remove() {
    if (iframe) {
      iframe.remove();
      iframe = null;
    }
  }

  function toggle() {
    iframe ? remove() : create();
  }

  return { create, remove, toggle };
})();

// ==========================================
// MODULE: SHORTCUT LISTENER
// ==========================================
window.addEventListener("keydown", (e) => {
  // Ctrl + Q hoặc Cmd + Q (Mac)
  if ((e.ctrlKey || e.metaKey) && e.code === "KeyQ") {
    e.preventDefault();
    UI.toggle();
  }
});

// ==========================================
// MODULE: MESSAGE LISTENER (From Iframe)
// ==========================================
// Lắng nghe lệnh đóng từ bên trong Iframe (Frontend gửi ra)
window.addEventListener("message", (event) => {
  // Check origin để bảo mật
  if (event.origin !== "https://localhost:3001") return;

  if (event.data === "CLOSE_EXTENSION_IFRAME") {
    UI.remove();
  }
});

console.log("✅ Vocab Quick Search Loaded: Press Ctrl+Q!");