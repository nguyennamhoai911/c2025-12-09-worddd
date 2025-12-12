// ==========================================
// MODULE: UI MANAGER
// ==========================================
const UI = (() => {
  let iframe = null;

  function create() {
    if (iframe) return;

    iframe = document.createElement("iframe");
    iframe.id = "vocab-extension-overlay";

    // Style đè full màn hình
    Object.assign(iframe.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      border: "none",
      zIndex: "2147483647",
      backgroundColor: "transparent", // Để React tự lo phần nền đen mờ
    });

    // Gọi về Frontend (Localhost)
    // iframeMode=true: để Frontend biết đường ẩn Header/Sidebar nếu cần
    iframe.src =
      "http://localhost:3000/vocabulary?openSearch=true&iframeMode=true";
    iframe.allow = "microphone *; camera *; clipboard-write"; // Cấp quyền Mic

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
  // Bắt sự kiện Shift + Q
  if (e.shiftKey && e.code === "KeyQ") {
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
  if (event.origin !== "http://localhost:3000") return;

  if (event.data === "CLOSE_EXTENSION_IFRAME") {
    UI.remove();
  }
});

console.log("✅ Vocab Extension Loaded: Press Shift+Q to open!");
