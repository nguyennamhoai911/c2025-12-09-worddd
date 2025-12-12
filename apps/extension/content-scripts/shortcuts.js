// shortcuts.js
import { toggleOverlay } from "./ui.js";

export const initShortcuts = () => {
  window.addEventListener("keydown", (e) => {
    // Logic: Shift + Q
    if (e.shiftKey && (e.key === "Q" || e.key === "q")) {
      e.preventDefault();
      console.log("🚀 Shortcut detected: Shift + Q");
      toggleOverlay();
    }
  });
};
