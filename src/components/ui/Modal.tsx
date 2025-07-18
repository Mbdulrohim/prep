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
    // The overlay with a backdrop for a modern look
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose} // Close modal when clicking the overlay
    >
      {/* The modal panel itself */}
      <div
        className="relative w-full max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 transform transition-all duration-200 scale-100"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-200 rounded-t-2xl bg-white">
          <div className="text-xl font-semibold text-gray-900">{title}</div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 bg-white rounded-b-2xl">{children}</div>
      </div>
    </div>
  );
}
