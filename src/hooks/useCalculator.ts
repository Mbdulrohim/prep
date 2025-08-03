// src/hooks/useCalculator.ts
"use client";

import { useState, useEffect } from "react";

export const useCalculator = () => {
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  useEffect(() => {
    const handleKeyboardShortcut = (event: KeyboardEvent) => {
      // Ctrl+Shift+C to toggle calculator
      if (event.ctrlKey && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        setIsCalculatorOpen(prev => !prev);
      }

      // Escape to close calculator
      if (event.key === 'Escape' && isCalculatorOpen) {
        setIsCalculatorOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcut);
    return () => window.removeEventListener('keydown', handleKeyboardShortcut);
  }, [isCalculatorOpen]);

  const openCalculator = () => setIsCalculatorOpen(true);
  const closeCalculator = () => setIsCalculatorOpen(false);
  const toggleCalculator = () => setIsCalculatorOpen(prev => !prev);

  return {
    isCalculatorOpen,
    openCalculator,
    closeCalculator,
    toggleCalculator,
  };
};
