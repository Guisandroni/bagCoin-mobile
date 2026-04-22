import React from "react";
import { Button } from "../ui/Button";

interface FooterProps {
  onConnect: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onConnect }) => {
  return (
    <>
      <section className="bg-surface py-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <blockquote className="text-4xl md:text-7xl font-bold tracking-tighter leading-tight">
            "WE ARE NOT BUILDING A BANK. WE ARE BUILDING THE{" "}
            <span className="bg-primary-container px-4">OPERATING SYSTEM</span>{" "}
            FOR GLOBAL VALUE."
          </blockquote>
          <cite className="block mt-12 font-label uppercase tracking-widest text-on-surface-variant not-italic">
            — The Kinetic Manifesto
          </cite>
        </div>
      </section>

      <section className="px-6 py-40">
        <div className="max-w-6xl mx-auto bg-on-background rounded-[4rem] p-12 md:p-24 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <img
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwhEDInUSHoELT2AGA36ms2GD6ZsATtKiJ0SROY10VFJLP59cjRCBTADcRb4-OnHBSbW9_TMZAPLF-UXMlopoXOcRQYErpvNc16mOjeLhwkUxVBuErU2C_6SrPSE1JA0Ainys-0UBu6lWVzb_FE5QweZ7DcYOx22GpHbzKefU2iYGz2ahzfKj9To4zxj1lV2m5_sqLRK6GYP4WiB0j190aWPWaIg9TwvSpFiwABRXifzRVgFywgm8roM80yxmTEdlmkbXpciMZM04D"
              alt="abstract background"
            />
          </div>
          <div className="relative z-10">
            <h2 className="text-5xl md:text-8xl font-bold text-background tracking-tighter mb-12">
              READY TO LEAP?
            </h2>
            <p className="text-background/70 text-xl max-w-2xl mx-auto mb-16">
              Join the waitlist or connect your WhatsApp to start moving
              capital at the speed of light.
            </p>
            <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
              <Button onClick={onConnect} size="xl" variant="primary">
                Connect with WhatsApp
              </Button>
              <Button size="xl" variant="outline" className="!text-background !border-background/20 hover:!bg-background hover:!text-on-background">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-background">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 py-16 w-full max-w-screen-2xl mx-auto border-t border-on-background/5">
          <div className="flex flex-col gap-4 mb-8 md:mb-0">
            <div className="font-headline font-bold text-on-background text-3xl">
              BagCoin
            </div>
            <p className="text-sm uppercase tracking-widest text-on-background/50">
              © 226 BagCoin Kinetic. All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-12 text-sm uppercase tracking-widest">
            <a className="text-on-background/70 hover:text-primary transition-all" href="#">
              Terms of Service
            </a>
            <a className="text-on-background/70 hover:text-primary transition-all" href="#">
              Privacy Policy
            </a>
            <a className="text-on-background/70 hover:text-primary transition-all" href="#">
              Security Audit
            </a>
          </div>
          <div className="mt-8 md:mt-0 flex gap-6">
            <a className="w-12 h-12 rounded-full border border-on-background/10 flex items-center justify-center hover:bg-primary-container transition-colors" href="#">
              <span className="material-symbols-outlined text-on-background">public</span>
            </a>
            <a className="w-12 h-12 rounded-full border border-on-background/10 flex items-center justify-center hover:bg-primary-container transition-colors" href="#">
              <span className="material-symbols-outlined text-on-background">alternate_email</span>
            </a>
          </div>
        </div>
      </footer>
    </>
  );
};
