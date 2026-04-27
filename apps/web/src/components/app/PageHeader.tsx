"use client";

import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 mb-2 animate-slide-in-up">
      <div>
        <h1 className="font-display font-black text-3xl text-near-black tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-gray mt-1.5 font-medium">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </header>
  );
}
