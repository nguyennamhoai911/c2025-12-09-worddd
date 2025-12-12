// ui.js
let iframeElement = null;

export const createOverlay = () => {
  if (iframeElement) return; // Đã tồn tại thì thôi

  // 1. Tạo Iframe
  iframeElement = document.createElement("iframe");

  // 2. Style cho Iframe (Full màn hình, đè lên tất cả)
  Object.assign(iframeElement.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    border: "none",
    zIndex: "2147483647", // Max z-index
    backgroundColor: "rgba(0,0,0,0.5)", // Màu nền tối mờ
    display: "block",
  });

  // 3. Load trang Vocabulary của Frontend vào
  // Thêm param ?openSearch=true để React biết đường mở Popup ngay lập tức
  iframeElement.src =
    "http://localhost:3000/vocabulary?openSearch=true&iframeMode=true";
  iframeElement.allow = "microphone; camera"; // Quan trọng: Cho phép dùng Mic trong Iframe

  document.body.appendChild(iframeElement);

  // 4. Focus vào iframe để gõ phím được ngay
  iframeElement.onload = () => {
    iframeElement.contentWindow.focus();
  };
};

export const removeOverlay = () => {
  if (iframeElement) {
    iframeElement.remove();
    iframeElement = null;
  }
};

export const toggleOverlay = () => {
  if (iframeElement) {
    removeOverlay();
  } else {
    createOverlay();
  }
};
