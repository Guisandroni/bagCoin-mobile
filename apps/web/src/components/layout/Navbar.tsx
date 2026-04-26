import React from "react";
import Link from "next/link";
import { Button } from "../ui/Button";

interface NavbarProps {
  onConnect: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onConnect }) => {
  return (
    <nav className="w-full top-0 sticky bg-white/80 backdrop-blur-md z-50">
      <div className="flex justify-between items-center px-8 py-5 max-w-screen-2xl mx-auto">
        <Link href="/" className="font-display font-black text-2xl tracking-tight text-near-black">
          Bagcoin
        </Link>
        <div className="hidden md:flex items-center gap-8 font-body font-semibold text-sm">
          <Link className="text-near-black hover:text-gray transition-colors duration-200" href="/app/dashboard">
            App
          </Link>
          <Link className="text-gray hover:text-near-black transition-colors duration-200" href="#features">
            Recursos
          </Link>
          <Link className="text-gray hover:text-near-black transition-colors duration-200" href="#">
            Preços
          </Link>
          <Link className="text-gray hover:text-near-black transition-colors duration-200" href="#">
            Sobre
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Button size="md" variant="outline" onClick={onConnect}>
            <span className="material-symbols-outlined text-base">chat</span>
            WhatsApp
          </Button>
          <Link href="/app/dashboard">
            <Button size="md">
              Acessar App
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};
