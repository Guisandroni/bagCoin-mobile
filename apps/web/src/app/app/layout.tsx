"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FinanceProvider } from "@/hooks/useFinance";
import { ToastProvider } from "@/components/app/Toast";
import { Sidebar } from "@/components/app/Sidebar";
import { Breadcrumbs } from "@/components/app/Breadcrumbs";
import { useAuth } from "@/hooks/useAuth";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wise-green" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <FinanceProvider>
        <ToastProvider>
          <div className="min-h-screen bg-light-surface/50 relative">
            {/* Background atmosphere */}
            <div className="fixed inset-0 pointer-events-none z-0">
              <div className="absolute inset-0 gradient-mesh opacity-60" />
              <div className="absolute inset-0 noise-overlay" />
            </div>
            
            <Sidebar />
            <main className="md:ml-64 min-h-screen transition-all duration-300 relative z-10">
              <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 pt-20 md:pt-6">
                <Breadcrumbs />
                {children}
              </div>
            </main>
          </div>
        </ToastProvider>
      </FinanceProvider>
    </AuthGuard>
  );
}
