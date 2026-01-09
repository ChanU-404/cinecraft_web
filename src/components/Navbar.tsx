"use client";
import React from "react";
import { MoveRight } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 glass bg-black/50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <span className="font-bold text-lg">A</span>
        </div>
        <span className="text-xl font-bold tracking-tight">Antigravity</span>
      </div>
      
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
        <a href="#" className="hover:text-white transition-colors">Features</a>
        <a href="#" className="hover:text-white transition-colors">Solutions</a>
        <a href="#" className="hover:text-white transition-colors">Pricing</a>
        <a href="#" className="hover:text-white transition-colors">Docs</a>
      </div>

      <button className="flex items-center gap-2 px-5 py-2 rounded-full bg-accent hover:bg-accent/90 transition-all font-medium text-sm group">
        Get Started
        <MoveRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </nav>
  );
}
