import React from "react";
import { Button } from "../ui/Button";

interface NavbarProps {
  onConnect: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onConnect }) => {
  return (
    <nav className="w-full top-0 sticky bg-background/80 backdrop-blur-md z-50">
      <div className="flex justify-between items-center px-8 py-6 max-w-screen-2xl mx-auto">
        <div className="text-2xl font-black tracking-tighter text-on-background">
          Backcoin
        </div>
        <div className="hidden md:flex items-center gap-10 font-headline tracking-tighter uppercase font-bold text-sm">
          <a className="text-on-background border-b-4 border-primary-container" href="#">
            Features
          </a>
          <a className="text-on-background/60 hover:text-on-background transition-colors duration-200" href="#">
            Protocol
          </a>
          <a className="text-on-background/60 hover:text-on-background transition-colors duration-200" href="#">
            Governance
          </a>
          <a className="text-on-background/60 hover:text-on-background transition-colors duration-200" href="#">
            Docs
          </a>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={onConnect} size="md">
            Launch App
          </Button>
        </div>
      </div>
    </nav>
  );
};
