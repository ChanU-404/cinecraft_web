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
  ImagePlus,
  Trash2,
  FolderOpen,
  Pencil,
  ClipboardList
} from 'lucide-react';
import { useScreenplay } from '@/context/ScreenplayContext';
import { useSession, signIn, signOut } from "next-auth/react";
import { OperationalInterview } from '@/components/OperationalInterview';
import { generateProductionDocuments } from '@/utils/documentGenerator';
import { CallSheetView } from '@/components/documents/CallSheetView';
import { ShootingScheduleView } from '@/components/documents/ShootingScheduleView';
import { CallSheetData, ShootingScheduleData } from '@/types/production';

export default function CineCraftWorkspace() {
  const { data: session, status } = useSession();
  const {
    scenes,
    setScenes,
    isAnalyzing,
    setIsAnalyzing,
    projects,
    currentProjectId,
    createNewProject,
    loadProject,
    saveCurrentProject,
    renameProject,
    deleteProjectHandler,
    isSaving
  } = useScreenplay();

  const [activeIdx, setActiveIdx] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  const [extractionComplete, setExtractionComplete] = useState(false);
  const [extractedText, setExtractedText] = useState("");

  // Project-Level Pre-Production State
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState<{ callSheet: CallSheetData; schedule: ShootingScheduleData } | null>(null);
  const [activeDocTab, setActiveDocTab] = useState<'schedule' | 'callsheet'>('schedule');

  // Helper to find title
  const currentProjectTitle = projects.find(p => p.id === currentProjectId)?.title || "Untitled Project";

  const handleStartPreProd = () => {
    if (scenes.length === 0) {
      alert("먼저 시나리오를 업로드하고 분석해야 합니다.");
      return;
    }
    setInterviewOpen(true);
  };

  const handleInterviewComplete = (answers: any) => {
    setInterviewOpen(false);

    // Generate Documents
    const docs = generateProductionDocuments(currentProjectTitle, scenes, answers);
    setGeneratedDocs(docs);
    setDocumentsOpen(true);
  };

  const handleExtract = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setErrorMsg(null);
    setStatusMessage("Reading PDF file...");
    setExtractionComplete(false);

    try {
      // Import PDF.js dynamically
      const pdfjs = await import('pdfjs-dist');
      // Use local worker to avoid CDN/CORS issues
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });

      const pdf = await loadingTask.promise;

      let fullText = "";
      setStatusMessage(`Extracting text from ${pdf.numPages} pages...`);

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n\n";

        if (i % 5 === 0) {
          setStatusMessage(`Processing... (${i}/${pdf.numPages})`);
        }
      }

      if (!fullText.trim()) {
        throw new Error("No text content found in PDF. Is this an image-only scan?");
      }

      // Basic cleanup
      const normalizedText = fullText
        .replace(/\x00/g, '') // Remove null characters
        .replace(/\n{3,}/g, '\n\n');

      setExtractedText(normalizedText);
      setExtractionComplete(true);
      setStatusMessage("Screenplay Loaded Successfully");

    } catch (err: any) {
      console.error("Client-side PDF Extraction Error:", err);
      let msg = "Failed to extract text.";
      if (err.name === 'InvalidPDFException' || err.message.includes('XRef')) {
        msg = "PDF File appears to be corrupted or invalid. Please try another file.";
      } else if (err.message.includes('worker')) {
        msg = "Worker initialization failed. Please refresh and try again.";
      }
      setErrorMsg(msg);
      setExtractionComplete(false);
    } finally {
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

      const parseData = await parseRes.json();

      if (!parseRes.ok) {
        throw new Error(parseData.error || parseData.details || 'Failed to parse screenplay');
      }
      if (parseData.scenes && Array.isArray(parseData.scenes)) {
        setScenes(parseData.scenes);
        setActiveIdx(0);
        setIsModalOpen(false);
        setExtractionComplete(false);
        setExtractedText("");

        // Auto-save new project
        const title = parseData.scenes[0]?.location ? `Project: ${parseData.scenes[0].location}...` : `Screenplay ${new Date().toLocaleDateString()}`;
        await saveCurrentProject(title);

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

  // ... (scroll logic same) ...
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div className="flex bg-[#0b0f17] text-[#e8eefc] h-screen overflow-hidden font-sans select-none relative">

      {/* Upload Modal (Same as before) */}
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
                <div className="space-y-4 mb-6">
                  <div className="text-xs text-red-500 font-bold bg-red-500/10 p-3 rounded-lg text-center">
                    🚨 {errorMsg}
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-[#64748b] mb-2 uppercase tracking-tighter">Parser failing? Try manual mode:</p>
                    <button
                      onClick={() => {
                        const text = prompt("Paste your screenplay text here:");
                        if (text) {
                          setExtractedText(text);
                          setExtractionComplete(true);
                          setErrorMsg(null);
                          setStatusMessage("Manual text ready for analysis");
                        }
                      }}
                      className="text-[10px] text-[#ff365c] hover:underline font-bold uppercase tracking-widest"
                    >
                      Paste Text Manually
                    </button>
                  </div>
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

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => {
              createNewProject();
              setIsModalOpen(true);
            }}
            className="w-full bg-[#ff365c]/10 border border-[#ff365c]/30 rounded-xl p-4 text-center cursor-pointer hover:bg-[#ff365c]/20 hover:border-[#ff365c] transition-all group"
          >
            <FileUp className="w-5 h-5 mx-auto mb-2 text-[#ff365c]" />
            <div className="text-[11px] font-bold text-[#ff365c]">New Screenplay Analysis</div>
          </button>

          {/* Manual Save & Status */}
          {currentProjectId && (
            <button
              onClick={() => saveCurrentProject?.()}
              disabled={isSaving}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-xl p-3 flex items-center justify-center gap-2 hover:bg-[#334155] transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#94a3b8]" />
                  <span className="text-xs font-bold text-[#94a3b8]">Saving...</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-xs font-bold text-emerald-500">Save Project</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">

          {/* Saved Projects Section */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#94a3b8] mb-3 font-bold opacity-40 px-2 flex items-center gap-2">
              <FolderOpen className="w-3 h-3" /> Saved Projects
            </div>
            <div className="space-y-1">
              {projects.map(p => (
                <div
                  key={p.id}
                  className={`
                                group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border text-xs
                                ${currentProjectId === p.id
                      ? 'bg-[#1e293b] border-[#ff365c]/50 text-white'
                      : 'bg-transparent border-transparent text-[#64748b] hover:bg-[#1e293b] hover:text-[#94a3b8]'}
                            `}
                  onClick={() => loadProject(p.id)}
                >
                  {/* Editable Title */}
                  {editingProjectId === p.id ? (
                    <input
                      autoFocus
                      className="bg-[#020617] border border-[#ff365c] text-white text-xs px-1 py-0.5 rounded w-full outline-none"
                      defaultValue={p.title}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={(e) => {
                        renameProject?.(p.id, e.target.value);
                        setEditingProjectId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          renameProject?.(p.id, e.currentTarget.value);
                          setEditingProjectId(null);
                        }
                      }}
                    />
                  ) : (
                    <div className="truncate pr-2 font-medium flex-1">
                      {p.title}
                    </div>
                  )}

                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProjectId(p.id);
                      }}
                      className="p-1 hover:text-white text-[#64748b] transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete Project?')) deleteProjectHandler(p.id);
                      }}
                      className="p-1 hover:text-red-500 text-[#64748b] transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="text-[10px] text-[#334155] px-3 py-2 italic text-center border border-dashed border-[#1f2937] rounded-lg">
                  No saved projects
                </div>
              )}
            </div>
          </div>

          {/* Current Project Scenes (Outline) */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#94a3b8] mb-3 font-bold opacity-40 px-2 mt-6">
              Current Outline
            </div>
            <div className="space-y-1">
              {scenes.map((scene, idx) => (
                <Link
                  key={scene.id}
                  href={`/scene/${encodeURIComponent(scene.id)}`}
                  className={`
                        group p-3 rounded-lg text-xs cursor-pointer transition-all duration-300 border bg-transparent border-transparent
                        hover:bg-[#1e293b] hover:text-[#e8eefc]
                        ${scene.selectedThumbnailUrl ? 'text-[#e8eefc]' : 'text-[#64748b]'}
                        `}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`w-1 h-1 rounded-full ${scene.selectedThumbnailUrl ? 'bg-[#ff365c]' : 'bg-[#334155]'}`} />
                    <span className="truncate font-medium">{scene.id}: {scene.location}</span>
                  </div>

                  {scene.selectedThumbnailUrl && (
                    <div className="w-full aspect-video rounded overflow-hidden border border-[#334155]/50 mt-2 opacity-80 group-hover:opacity-100 transition-opacity">
                      <img
                        src={scene.selectedThumbnailUrl}
                        alt="Scene Cover"
                        className="w-full h-full object-cover grayscale brightness-110 contrast-125"
                      />
                    </div>
                  )}
                </Link>
              ))}
              {scenes.length === 0 && (
                <div className="text-[#334155] text-[10px] text-center opacity-50 p-2">
                  (Empty)
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#0f172a] rounded-2xl border border-[#1f2937]">
          {status === "authenticated" && session?.user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#ff365c] to-[#ff8f00] flex items-center justify-center text-xs font-bold text-white uppercase">
                  {session.user.name?.[0] || 'U'}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{session.user.name}</div>
                  <div className="text-[10px] text-[#94a3b8]">{session.user.email}</div>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="w-full py-1.5 bg-[#1f2937] hover:bg-[#334155] text-[10px] text-[#94a3b8] hover:text-white rounded-lg transition-colors border border-[#334155] uppercase font-bold tracking-widest"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-[10px] text-[#94a3b8] mb-2 uppercase font-bold tracking-widest">Workspace Access</div>
              <button
                onClick={() => signIn()}
                className="w-full py-2 bg-[#ff365c] hover:bg-[#ff1f4b] text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-[#ff365c]/20 uppercase tracking-widest"
              >
                Log In
              </button>
              <div className="text-[10px] text-[#52525b] text-center">
                Sign in to save projects
              </div>
            </div>
          )}
        </div>
      </aside >

      {/* Main Analysis Canvas */}
      < main className="flex-1 flex flex-col min-w-0" >
        <header className="h-16 border-b border-[#1f2937] flex items-center justify-between px-10 bg-[#0b0f17]/80 backdrop-blur-xl z-30">
          <div className="flex items-center gap-4 text-xs text-[#94a3b8] font-bold tracking-widest uppercase">
            <Layout className="w-4 h-4 text-[#ff365c]" />
            <span>Visualization Flow</span>
          </div>

          <div className="flex items-center gap-6">
            {/* Project Level Pre-Prod Trigger */}
            {scenes.length > 0 && (
              <button
                onClick={handleStartPreProd}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all"
              >
                <ClipboardList className="w-4 h-4" />
                <span>Start Pre-Production</span>
              </button>
            )}

            <div className="text-xs font-mono text-[#52525b] border border-[#27272a] px-3 py-1 rounded">
              TOTAL SCENES: {scenes.length}
            </div>
          </div>
        </header>

        {/* Project Level Interview Modal */}
        <AnimatePresence>
          {interviewOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 lg:p-20"
            >
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="w-full max-w-2xl h-[600px] relative pointer-events-auto"
              >
                <OperationalInterview
                  onComplete={handleInterviewComplete}
                  onClose={() => setInterviewOpen(false)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Document Result Modal */}
        <AnimatePresence>
          {documentsOpen && generatedDocs && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col pointer-events-auto"
            >
              {/* Doc Header */}
              <div className="h-14 border-b border-[#334155] flex items-center justify-between px-6 bg-[#0f172a]">
                <div className="flex items-center gap-4">
                  <h2 className="text-white font-bold text-lg">Production Documents</h2>
                  <div className="flex bg-[#1e293b] rounded-lg p-1">
                    <button
                      onClick={() => setActiveDocTab('schedule')}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeDocTab === 'schedule' ? 'bg-[#ff365c] text-white' : 'text-[#94a3b8] hover:text-white'}`}
                    >
                      Shooting Schedule
                    </button>
                    <button
                      onClick={() => setActiveDocTab('callsheet')}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeDocTab === 'callsheet' ? 'bg-[#ff365c] text-white' : 'text-[#94a3b8] hover:text-white'}`}
                    >
                      Call Sheet
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setDocumentsOpen(false)}
                  className="p-2 hover:bg-[#334155] rounded-full text-[#94a3b8] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Doc Content */}
              <div className="flex-1 overflow-hidden">
                {activeDocTab === 'schedule' ? (
                  <ShootingScheduleView
                    data={generatedDocs.schedule}
                    onUpdate={(newData) => setGeneratedDocs(prev => prev ? ({ ...prev, schedule: newData }) : null)}
                  />
                ) : (
                  <CallSheetView
                    data={generatedDocs.callSheet}
                    onUpdate={(newData) => setGeneratedDocs(prev => prev ? ({ ...prev, callSheet: newData }) : null)}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden bg-[#0b0f17] relative custom-scrollbar scroll-smooth"
        >
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
                        relative bg-[#111827] rounded-[40px] p-8 w-[420px] h-[360px] transition-all duration-500 cursor-pointer border-2 border-[#1f2937] opacity-80 hover:opacity-100 hover:border-[#ff365c] shadow-2xl hover:scale-[1.02] hover:z-10 group overflow-hidden flex flex-col
                      `}
                    >
                      {/* Background Image (Scene Cover) */}
                      {scene.selectedThumbnailUrl && (
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                          style={{ backgroundImage: `url(${scene.selectedThumbnailUrl})` }}
                        />
                      )}

                      {/* Readability Overlay */}
                      <div className={`absolute inset-0 transition-colors duration-500 ${scene.selectedThumbnailUrl ? 'bg-[#020617]/85' : 'bg-transparent'}`} />

                      <div className="relative z-10 flex-1 flex flex-col">
                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#1f2937]/80 backdrop-blur text-[10px] font-black text-[#ff365c] tracking-widest uppercase mb-4 self-start border border-[#ff365c]/20">
                          {scene.id}
                        </div>

                        <div className="text-[10px] font-bold text-[#ff365c] mb-2 tracking-tighter uppercase">{scene.location}</div>
                        <h2 className="text-lg font-bold text-white mb-6 leading-tight tracking-tight line-clamp-2">
                          {scene.summary}
                        </h2>

                        {/* Storyboard Strip Preview - Full Width Attached */}
                        <div className="mt-auto pt-4 border-t border-[#1f2937]/50 w-full">
                          <div className="flex items-center gap-2 text-[9px] font-bold text-[#94a3b8] uppercase tracking-widest mb-3 px-1">
                            <Film className="w-3 h-3 text-[#ff365c]" />
                            <span>Visual Sequence</span>
                          </div>

                          <div className="flex w-full h-32 rounded-xl overflow-hidden border border-[#334155] bg-[#020617]">
                            {scene.shots.filter(s => s.selectedImageUrl).length > 0 ? (
                              scene.shots.filter(s => s.selectedImageUrl).map((shot, i) => (
                                <div key={shot.id} className="flex-1 relative group/shot h-full border-r last:border-r-0 border-[#1f2937] min-w-0">
                                  <img
                                    src={shot.selectedImageUrl}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover/shot:scale-110"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover/shot:bg-black/20 transition-colors" />
                                </div>
                              ))
                            ) : (
                              <div className="w-full py-4 border border-dashed border-[#334155] rounded-lg flex items-center justify-center gap-2 text-[10px] text-[#52525b] uppercase font-bold tracking-wider">
                                <Camera className="w-3 h-3" />
                                <span>No Shots Selected</span>
                              </div>
                            )}
                            {/* Placeholder for unselected but existing suggestions if none selected */}
                            {scene.shots.filter(s => s.selectedImageUrl).length === 0 && scene.shots.length > 0 && (
                              <span className="text-[9px] text-[#52525b] ml-auto self-center">{scene.shots.length} shots planned</span>
                            )}
                          </div>
                        </div>

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
      </main >

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
    </div >
  );
}
