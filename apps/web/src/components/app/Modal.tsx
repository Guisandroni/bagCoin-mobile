"use client";

import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />
      <div className={`relative bg-white rounded-[30px] p-6 md:p-8 w-full ${maxWidth} shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto my-auto`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-black text-2xl text-near-black">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-light-surface flex items-center justify-center btn-scale hover:bg-near-black/5 transition-colors">
            <span className="material-symbols-outlined text-warm-dark">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
