import { useState, useCallback, useRef } from 'react';

/**
 * Hook to coordinate modal entrance and exit animations before unmounting.
 * When `close()` is called, it adds the `modal-closing` class for `duration` ms
 * before setting `isOpen` state to false.
 */
export function useModalClose(
  isOpen: boolean,
  setIsOpen: (open: boolean) => void,
  duration = 220
) {
  const [isClosing, setIsClosing] = useState(false);
  const timerRef = useRef<number | null>(null);

  const close = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    timerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, duration);
  }, [isClosing, setIsOpen, duration]);

  const shouldRender = isOpen || isClosing;
  const overlayClass = `responsive-modal-overlay ${isClosing ? 'modal-closing' : ''}`;
  const cardClass = `responsive-modal-card ${isClosing ? 'modal-closing' : ''}`;

  return {
    shouldRender,
    isClosing,
    close,
    overlayClass,
    cardClass,
  };
}
