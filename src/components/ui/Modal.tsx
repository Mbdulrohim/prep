"use client";

import React from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
  if (!isOpen) return null;

  return (
    // The overlay with a backdrop blur for a modern look
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
      onClick={onClose} // Close modal when clicking the overlay
    >
      {/* The modal panel itself */}
      <div
        className="relative w-full max-w-lg mx-auto bg-card rounded-2xl shadow-xl border border-border animate-in fade-in-0 zoom-in-95"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 border-b border-border rounded-t-2xl">
          <div className="text-xl font-semibold text-foreground">{title}</div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
