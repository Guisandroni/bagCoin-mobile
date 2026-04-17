"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { BentoGrid } from "@/components/sections/BentoGrid";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";

export default function LandingPage() {
  const { connectPlatform, isLoading } = useAuth();

  return (
    <div className="bg-background text-on-background min-h-screen">
      <Navbar onConnect={() => connectPlatform("whatsapp")} />
      
      <main>
        <Hero onConnect={connectPlatform} isLoading={isLoading} />
        <BentoGrid />
      </main>

      <Footer onConnect={() => connectPlatform("whatsapp")} />
    </div>
  );
}
