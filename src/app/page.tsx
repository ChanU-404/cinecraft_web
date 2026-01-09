"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Film,
  FileUp,
  Layout,
  Camera,
  Clock,
  ChevronRight,
  Info,
  Loader2,
  X,
  ImagePlus
} from 'lucide-react';
import { useScreenplay } from '@/context/ScreenplayContext';

export default function CineCraftWorkspace() {
  const { scenes, setScenes, isAnalyzing, setIsAnalyzing, storyboardCache, updateStoryboardCache } = useScreenplay();
  const [activeIdx, setActiveIdx] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const [extractionComplete, setExtractionComplete] = useState(false);
  const [extractedText, setExtractedText] = useState("");

  const handleExtract = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setErrorMsg(null);
    setStatusMessage("Extracting text from PDF...");
    setExtractionComplete(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Force a timeout race for extraction
      const extractPromise = fetch('/api/extract', { method: 'POST', body: formData });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Extraction timed out')), 10000));

      const extractRes = await Promise.race([extractPromise, timeoutPromise]) as Response;
      const extractData = await extractRes.json();

      if (!extractRes.ok) throw new Error(extractData.error || 'Extraction failed');

      setExtractedText(extractData.text);
      setExtractionComplete(true);
      setStatusMessage("PDF Ready for Analysis");

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to upload.");
      setIsAnalyzing(false); // Stop loading on error
    } finally {
      // Do not set isAnalyzing(false) if success, because we transition to "Ready" state which might technically still be "process flow"
      // But to ensure UI responsiveness, let's toggle:
      if (extractionComplete) setIsAnalyzing(false);
      // Actually, let's keep isAnalyzing true ONLY during active async, and use a separate state 'isExtracting' vs 'isParsing'
      // For minimal refactor, let's just use isAnalyzing = false here so the user sees the "Analyze" button.
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!extractedText) return;

    setIsAnalyzing(true);
    setStatusMessage("AI Director is breaking down the script...");

    try {
      const parseRes = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptText: extractedText })
      });

      if (!parseRes.ok) throw new Error('Failed to parse screenplay');

      const parseData = await parseRes.json();
      if (parseData.scenes && Array.isArray(parseData.scenes)) {
        setScenes(parseData.scenes);
        setActiveIdx(0);
        setIsModalOpen(false);
        setExtractionComplete(false); // Reset
        setExtractedText("");
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsAnalyzing(false);
      setStatusMessage("");
    }
  };

  return (
    <div className="flex bg-[#0b0f17] text-[#e8eefc] h-screen overflow-hidden font-sans select-none relative">

      {/* Upload Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#111827] border border-[#334155] w-full max-w-xl rounded-2xl p-8 shadow-2xl relative"
            >
              <button
                onClick={() => !isAnalyzing && setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-[#94a3b8] hover:text-white hover:bg-white/10 rounded-full transition-colors"
                disabled={isAnalyzing}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-[#ff365c]/10 rounded-xl text-[#ff365c]">
                  <FileUp className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Upload Screenplay PDF</h2>
                  <p className="text-sm text-[#94a3b8]">Strictly PDF only. The AI will infer the structure.</p>
                </div>
              </div>

              {/* PDF Drop Zone */}
              <div className={`
                relative border-2 border-dashed rounded-xl p-10 mb-6 transition-all text-center group
                ${isAnalyzing ? 'border-[#ff365c] bg-[#ff365c]/5 cursor-wait' : 'border-[#334155] hover:border-[#ff365c]/50 hover:bg-[#ff365c]/5'}
                ${extractionComplete ? 'border-[#10b981] bg-[#10b981]/10' : ''}
              `}>
                {!isAnalyzing && !extractionComplete && (
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleExtract}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                )}

                <div className="flex flex-col items-center gap-4 text-[#94a3b8] group-hover:text-[#cbd5f5]">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-10 h-10 animate-spin text-[#ff365c]" />
                      <div className="text-sm font-bold text-[#ff365c]">{statusMessage}</div>
                    </>
                  ) : extractionComplete ? (
                    <>
                      <div className="p-4 bg-[#10b981]/20 rounded-full text-[#10b981]">
                        <FileUp className="w-8 h-8" />
                      </div>
                      <div className="text-white font-bold text-lg">PDF Extracted Successfully</div>
                      <div className="text-xs text-[#94a3b8] mb-4">Ready to generate scene graph</div>
                      <button
                        onClick={handleAnalyze}
                        className="bg-[#10b981] hover:bg-[#059669] text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-transform hover:scale-105 shadow-lg shadow-[#10b981]/20"
                      >
                        Start AI Director Analysis
                      </button>
                    </>
                  ) : (
                    <>
                      <FileUp className="w-10 h-10 opacity-50" />
                      <div className="space-y-1">
                        <div className="text-sm font-bold uppercase tracking-widest">Click to Upload PDF</div>
                        <div className="text-xs opacity-50">No manual entry. No DOCX.</div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {errorMsg && (
                <div className="mb-6 text-xs text-red-500 font-bold bg-red-500/10 p-3 rounded-lg text-center">
                  🚨 {errorMsg}
                </div>
              )}

              <div className="text-[10px] text-center text-[#52525b] uppercase tracking-widest font-medium">
                CineCraft AI Assistant Director Mode
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-[280px] bg-[#020617] border-r border-[#1f2937] p-6 flex flex-col gap-8 z-20">
        <div className="text-2xl font-black italic tracking-tighter text-[#ff365c] flex items-center gap-2">
          <Film className="w-7 h-7" /> CINECRAFT
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#ff365c]/10 border border-[#ff365c]/30 rounded-xl p-4 text-center cursor-pointer hover:bg-[#ff365c]/20 hover:border-[#ff365c] transition-all group"
        >
          <FileUp className="w-5 h-5 mx-auto mb-2 text-[#ff365c]" />
          <div className="text-[11px] font-bold text-[#ff365c]">New Screenplay Analysis</div>
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#94a3b8] mb-5 font-bold opacity-40 px-2">Scenario Outline</div>
          <div className="space-y-2">
            {scenes.map((scene, idx) => (
              <Link
                key={scene.id}
                href={`/scene/${encodeURIComponent(scene.id)}`}
                className={`
                  group p-4 rounded-2xl text-sm cursor-pointer transition-all duration-300 flex items-center gap-3 border bg-transparent border-transparent text-[#94a3b8] hover:bg-white/5 hover:text-[#e8eefc]
                `}
              >
                <span className={`w-1.5 h-1.5 rounded-full bg-[#334155] group-hover:bg-[#ff365c]`} />
                {scene.id}
              </Link>
            ))}
            {scenes.length === 0 && (
              <div className="text-[#94a3b8] text-xs text-center py-10 opacity-50">
                No scenes yet. Upload a PDF.
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-[#0f172a] rounded-2xl border border-[#1f2937]">
          <div className="text-[10px] text-[#94a3b8] mb-2 uppercase font-bold tracking-widest">Workspace Status</div>
          <div className="text-xs font-medium text-[#cbd5f5]">AI Engine Active · Online</div>
        </div>
      </aside>

      {/* Main Analysis Canvas */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-[#1f2937] flex items-center justify-between px-10 bg-[#0b0f17]/80 backdrop-blur-xl z-30">
          <div className="flex items-center gap-4 text-xs text-[#94a3b8] font-bold tracking-widest uppercase">
            <Layout className="w-4 h-4 text-[#ff365c]" />
            <span>Visualization Flow</span>
          </div>
          <div className="text-xs font-mono text-[#52525b] border border-[#27272a] px-3 py-1 rounded">
            TOTAL SCENES: {scenes.length}
          </div>
        </header>

        <div className="flex-1 overflow-x-auto overflow-y-hidden bg-[#0b0f17] relative custom-scrollbar scroll-smooth">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

          {scenes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#334155]">
              <FileUp className="w-16 h-16 opacity-20 mb-4" />
              <p className="text-sm font-bold tracking-widest uppercase opacity-50">Upload a PDF to Begin</p>
            </div>
          ) : (
            <div className="flex items-center h-full gap-12 px-24 min-w-max">
              {scenes.map((scene, idx) => (
                <React.Fragment key={scene.id}>
                  <Link href={`/scene/${encodeURIComponent(scene.id)}`}>
                    <div
                      className={`
                        relative bg-[#111827] rounded-[40px] p-10 w-[420px] transition-all duration-500 cursor-pointer border-2 border-[#1f2937] opacity-80 hover:opacity-100 hover:border-[#ff365c] shadow-2xl hover:scale-[1.02] hover:z-10
                      `}
                    >
                      <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#1f2937] text-[10px] font-black text-[#ff365c] tracking-widest uppercase mb-8">
                        {scene.id}
                      </div>

                      <div className="text-xs font-bold text-[#ff365c] mb-3 tracking-tighter uppercase">{scene.location}</div>
                      <h2 className="text-xl font-bold text-white mb-6 leading-tight tracking-tight">
                        {scene.summary}
                      </h2>

                      <div className="flex items-center gap-2 text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest bg-[#020617] p-3 rounded-xl border border-[#1f2937]">
                        <Camera className="w-4 h-4 text-[#ff365c]" />
                        <span>{scene.shots.length} Suggestions</span>
                      </div>
                    </div>
                  </Link>

                  {idx < scenes.length - 1 && (
                    <div className="flex-shrink-0 flex flex-col items-center gap-2 opacity-20">
                      <ChevronRight className="w-12 h-12 text-[#ff365c]" />
                      <span className="text-[8px] font-black tracking-[0.4em] uppercase">Connect</span>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1f2937;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #ff365c;
        }
      `}</style>
    </div>
  );
}
