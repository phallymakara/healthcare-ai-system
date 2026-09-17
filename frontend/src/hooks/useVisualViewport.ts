import { useState, useEffect } from "react";

export function useVisualViewport() {
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [viewportHeight, setViewportHeight] = useState<number>(() =>
    typeof window !== "undefined" && window.visualViewport
      ? window.visualViewport.height
      : typeof window !== "undefined"
      ? window.innerHeight
      : 0
  );
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;

    const isMobileDevice = () => window.innerWidth <= 1023;

    const checkKeyboard = () => {
      if (vv) {
        const layoutHeight = window.innerHeight;
        const visibleHeight = vv.height;
        const offset = Math.max(0, layoutHeight - visibleHeight);
        setKeyboardOffset(offset);
        setViewportHeight(visibleHeight);
        if (offset > 60) {
          setIsKeyboardOpen(true);
          return;
        }
      }

      const activeEl = document.activeElement as HTMLElement | null;
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.getAttribute("contenteditable") === "true");

      if (isMobileDevice() && isInputFocused) {
        setIsKeyboardOpen(true);
      } else {
        setIsKeyboardOpen(false);
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        isMobileDevice() &&
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.getAttribute("contenteditable") === "true")
      ) {
        setIsKeyboardOpen(true);
        setTimeout(checkKeyboard, 50);
        setTimeout(checkKeyboard, 200);
      }
    };

    const handleFocusOut = () => {
      setTimeout(checkKeyboard, 100);
      setTimeout(checkKeyboard, 300);
    };

    if (vv) {
      vv.addEventListener("resize", checkKeyboard);
      vv.addEventListener("scroll", checkKeyboard);
    }
    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);
    checkKeyboard();

    return () => {
      if (vv) {
        vv.removeEventListener("resize", checkKeyboard);
        vv.removeEventListener("scroll", checkKeyboard);
      }
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  return { keyboardOffset, viewportHeight, isKeyboardOpen };
}

