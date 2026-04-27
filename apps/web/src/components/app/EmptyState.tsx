"use client";

import React from "react";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-3xl p-12 ring-shadow text-center relative overflow-hidden">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-wise-green/10 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="w-20 h-20 rounded-3xl bg-light-surface flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-4xl text-gray">{icon}</span>
        </div>
        <h3 className="font-display font-bold text-xl text-near-black mb-2">{title}</h3>
        <p className="text-sm text-gray max-w-sm mx-auto mb-6">{description}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="bg-wise-green text-dark-green font-semibold px-6 py-3 rounded-full btn-scale text-sm inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
