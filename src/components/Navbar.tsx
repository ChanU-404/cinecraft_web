"use client";
import React from "react";
import { MoveRight } from "lucide-react";

import { useLanguage } from "@/context/LanguageContext";

export default function Navbar() {
  const { t, language, setLanguage } = useLanguage();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 glass bg-black/50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <span className="font-bold text-lg">A</span>
        </div>
        <span className="text-xl font-bold tracking-tight">{t('navbar', 'brand')}</span>
      </div>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
        <a href="#" className="hover:text-white transition-colors">{t('navbar', 'features')}</a>
        <a href="#" className="hover:text-white transition-colors">{t('navbar', 'solutions')}</a>
        <a href="#" className="hover:text-white transition-colors">{t('navbar', 'pricing')}</a>
        <a href="#" className="hover:text-white transition-colors">{t('navbar', 'docs')}</a>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setLanguage(language === 'en' ? 'ko' : 'en')}
          className="text-xs font-bold uppercase tracking-widest text-[#94a3b8] hover:text-white border border-[#334155] px-2 py-1 rounded transition-colors"
        >
          {language === 'en' ? 'KOR' : 'ENG'}
        </button>
        <button className="flex items-center gap-2 px-5 py-2 rounded-full bg-accent hover:bg-accent/90 transition-all font-medium text-sm group">
          {t('navbar', 'getStarted')}
          <MoveRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </nav>
  );
}
