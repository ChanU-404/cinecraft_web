"use client";

import React, { useState } from 'react';
import { useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useScreenplay } from '@/context/ScreenplayContext';
import {
    ArrowLeft,
    Clock,
    Camera,
    Loader2,
    ImagePlus,
    Film,
    RefreshCw,
    Maximize2,
    MessageSquare,
    Send,
    Download,
    FileText,
    Check,
    X
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { exportStoryboardPDF } from '@/utils/pdfExport';

import { useLanguage } from '@/context/LanguageContext';

export default function SceneDetailPage() {
    const { t } = useLanguage();
    const params = useParams();
    const router = useRouter();
    const { scenes, storyboardCache, updateStoryboardCache, updateSceneShots, selectSceneThumbnail, selectShotImage, currentProjectId, projects, updateSceneGlobalContext, projectGlobalContext } = useScreenplay();
    const [generatingShotId, setGeneratingShotId] = useState<string | null>(null);
    const [generatingCount, setGeneratingCount] = useState(0);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isExportingAll, setIsExportingAll] = useState(false);


    // Helper to get project title
    const currentProject = projects.find(p => p.id === currentProjectId);
    const projectTitle = currentProject?.title || "CineCraft Project";

    const handleExportPDF = async () => {
        const sceneIdParam = decodeURIComponent(params.id as string);
        const targetScene = scenes.find(s => s.id === sceneIdParam);
        if (!targetScene) return;

        setIsExporting(true);
        try {
            await exportStoryboardPDF(targetScene, projectTitle);
        } catch (error) {
            console.error("PDF Export failed:", error);
            alert("Failed to export PDF.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportProjectPDF = async () => {
        setIsExportingAll(true);
        try {
            await exportStoryboardPDF(scenes, projectTitle);
        } catch (e) {
            console.error("Project Export failed", e);
            alert("Failed to export Project PDF.");
        } finally {
            setIsExportingAll(false);
        }
    };

    // Chat State
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isChatting, setIsChatting] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const sceneId = typeof params.id === 'string' ? decodeURIComponent(params.id) : '';
    const scene = scenes.find(s => s.id === sceneId);

    // Scroll Reset on Scene Change
    const mainContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Enforce scroll to top with a small delay to handle layout shifts
        setTimeout(() => {
            if (mainContentRef.current) {
                mainContentRef.current.scrollTo({ top: 0, behavior: 'instant' });
            }
        }, 10);
    }, [sceneId]);

    // Global Context State
    const [isContextModalOpen, setIsContextModalOpen] = useState(false);
    const [localContext, setLocalContext] = useState(scene?.globalContext || "");

    useEffect(() => {
        setLocalContext(scene?.globalContext || "");
    }, [scene?.globalContext]);

    const handleSaveContext = () => {
        if (scene) {
            updateSceneGlobalContext(scene.id, localContext);
            setIsContextModalOpen(false);
        }
    };

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    const handleChatSubmit = async () => {
        if (!chatInput.trim() || !scene) return;

        const userMsg = chatInput;
        setChatInput("");
        setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsChatting(true);

        try {
            const res = await fetch('/api/assist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: chatMessages.concat({ role: 'user', content: userMsg }),
                    scene: { location: scene.location, id: scene.id },
                    shots: scene.shots,
                    projectGlobalContext: projectGlobalContext // Pass Director's Note
                })
            });

            const data = await res.json();

            if (data.reply) {
                setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
            }

            if (data.operations && Array.isArray(data.operations)) {
                let newShots = [...scene.shots];
                const modifiedShotIds = new Set<string>();

                for (const op of data.operations) {
                    if (op.type === 'UPDATE_SHOT') {
                        const idx = newShots.findIndex(s => s.id === op.id);
                        if (idx >= 0) {
                            newShots[idx] = { ...newShots[idx], ...op.updates };
                            modifiedShotIds.add(op.id);
                        }
                    }
                    else if (op.type === 'SPLIT_SHOT') {
                        const idx = newShots.findIndex(s => s.id === op.id);
                        if (idx >= 0) {
                            newShots.splice(idx, 1, ...op.newShots);
                            op.newShots.forEach((s: any) => modifiedShotIds.add(s.id));
                        }
                    }
                    else if (op.type === 'ADD_SHOT') {
                        const idx = newShots.findIndex(s => s.id === op.afterId);
                        if (idx >= 0) {
                            newShots.splice(idx + 1, 0, op.shot);
                            modifiedShotIds.add(op.shot.id);
                        } else {
                            newShots.push(op.shot);
                            modifiedShotIds.add(op.shot.id);
                        }
                    }
                    else if (op.type === 'DELETE_SHOT') {
                        newShots = newShots.filter(s => s.id !== op.id);
                        modifiedShotIds.delete(op.id);
                    }
                }

                updateSceneShots?.(scene.id, newShots);

                // Auto-generate visuals
                modifiedShotIds.forEach(id => {
                    const shot = newShots.find(s => s.id === id);
                    if (shot) {
                        handleGenerateStoryboard(shot, true);
                    }
                });
            }

        } catch (e) {
            console.error(e);
            setChatMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error processing that request." }]);
        } finally {
            setIsChatting(false);
        }
    };

    // Redirect or Search State
    if (!scene && scenes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#0b0f17] text-[#94a3b8] gap-4">
                <Film className="w-12 h-12 text-[#334155]" />
                <p>No scene data found. Please return to workspace.</p>
                <button
                    onClick={() => router.push('/')}
                    className="px-6 py-2 bg-[#1f2937] hover:bg-[#334155] rounded-xl text-white text-sm transition-colors border border-[#334155]"
                >
                    {t('sceneDetail', 'returnToWorkspace')}
                </button>
            </div>
        );
    }

    if (!scene) {
        return (
            <div className="h-screen bg-[#0b0f17] flex flex-col items-center justify-center gap-6 p-8">
                <Loader2 className="animate-spin w-8 h-8 text-[#ff365c]" />
                <div className="text-center space-y-4 max-w-lg">
                    <h2 className="text-xl font-bold text-white">Searching for Scene...</h2>
                    <p className="text-[#94a3b8] text-sm font-mono">Target ID: <span className="text-[#ff365c]">{sceneId}</span></p>
                </div>
                <button
                    onClick={() => router.push('/')}
                    className="mt-8 px-6 py-2 bg-[#1f2937] hover:bg-[#334155] rounded-xl text-white text-sm transition-colors border border-[#334155]"
                >
                    {t('sceneDetail', 'returnToWorkspace')}
                </button>
            </div>
        );
    }

    const handleGenerateStoryboard = async (shot: any, forceRegenerate = false) => {
        if (generatingShotId === shot.id && !forceRegenerate) return;

        // Extract script context for continuity
        const scriptContext = (scene?.script_blocks || [])
            .filter((b: { type: string; speaker?: string; text: string }) => b.type === 'action' || b.type === 'dialogue')
            .map((b: { type: string; speaker?: string; text: string }) => b.type === 'dialogue' ? `${b.speaker}: ${b.text}` : b.text)
            .slice(0, 5) // Take first 5 blocks to establish scene context
            .join('\n');

        setGeneratingShotId(shot.id);
        setGeneratingCount(prev => prev + 1); // Start tracking
        try {
            const response = await fetch('/api/storyboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shotId: shot.id,
                    sceneContext: {
                        location: scene.location,
                        time: scene.time || "Day",
                        emotion: [],
                        directorIntent: scene.directorIntent,
                        sceneGlobalContext: scene.globalContext,
                        projectGlobalContext: projectGlobalContext, // Pass Project Note
                        contextSummary: scriptContext
                    },
                    shot: {
                        type: shot.type,
                        camera: shot.camera,
                        description: shot.description
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                if (errData.error && errData.error.includes("filtered")) {
                    alert("프롬프트가 정책에 의해 차단되었거나 생성에 실패했습니다. 문장을 바꿔 다시 시도해주세요.");
                    throw new Error("Content Filtered");
                }
                const msg = errData.error || 'Generation failed';
                alert(`Error: ${msg}`);
                throw new Error(msg);
            }

            const data = await response.json();

            // Adapter for new multi-image format
            if (data.images && Array.isArray(data.images)) {
                updateStoryboardCache(shot.id, data.images);
                // Auto-select the first variant (A)
                if (data.images.length > 0) {
                    // optional: selectShotImage?.(scene.id, shot.id, data.images[0].imageUrl);
                }
            } else if (data.image) {
                // Legacy fallback for single image
                updateStoryboardCache(shot.id, [{ variant: 'A', imageUrl: data.image }]);
            }

        } catch (err) {
            console.error(err);
            alert("Failed to generate storyboard.");
        } finally {
            setGeneratingShotId(null);
            setGeneratingCount(prev => Math.max(0, prev - 1)); // End tracking
        }
    };


    return (
        <div className="bg-[#0b0f17] h-screen flex flex-col overflow-hidden text-[#e8eefc] font-sans">

            {/* Lightbox */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedImage(null)}
                        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-10 cursor-pointer"
                    >
                        <motion.img
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            src={selectedImage}
                            className="max-w-full max-h-full rounded-lg shadow-2xl border border-[#334155]"
                        />
                        <button className="absolute top-6 right-6 p-4 text-white hover:bg-white/10 rounded-full">
                            <Maximize2 className="w-6 h-6" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Global Context Modal */}
            <AnimatePresence>
                {isContextModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 text-white"
                        onClick={() => setIsContextModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#111827] border border-[#334155] w-full max-w-lg rounded-2xl p-6 shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-[#ff365c]" />
                                    {t('globalContext', 'title')}
                                </h2>
                                <button onClick={() => setIsContextModalOpen(false)} className="p-2 hover:bg-[#1f2937] rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-sm text-[#94a3b8] mb-4">
                                {t('globalContext', 'description')}
                            </p>

                            <textarea
                                value={localContext}
                                onChange={(e) => setLocalContext(e.target.value)}
                                placeholder={`${t('globalContext', 'characterPlaceholder')}\n${t('globalContext', 'backgroundPlaceholder')}`}
                                className="w-full h-40 bg-[#020617] border border-[#334155] rounded-xl p-4 text-sm focus:outline-none focus:border-[#ff365c] resize-none mb-6"
                            />

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsContextModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-bold text-[#94a3b8] hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveContext}
                                    className="px-6 py-2 rounded-lg bg-[#ff365c] hover:bg-[#ff365c]/80 text-white text-sm font-bold"
                                >
                                    {t('globalContext', 'save')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header - Flex None to stay at top */}
            <header className="flex-none h-16 bg-[#0b0f17]/90 backdrop-blur-md border-b border-[#1f2937] flex items-center px-6 z-50">
                <button
                    onClick={() => router.push('/')}
                    className="mr-6 p-2 hover:bg-[#1f2937] rounded-full transition-colors group"
                >
                    <ArrowLeft className="w-5 h-5 text-[#94a3b8] group-hover:text-white" />
                </button>
                <div>
                    <h1 className="text-lg font-bold text-white flex items-center gap-3">
                        <span className="bg-[#ff365c] text-[10px] font-black px-2 py-0.5 rounded text-white tracking-widest">{scene.id}</span>
                        {scene.location}
                    </h1>
                </div>
                <div className="ml-auto flex items-center gap-3 text-xs font-mono text-[#94a3b8]">
                    {/* Export Group */}
                    <div className="flex items-center bg-[#1f2937] rounded-lg border border-[#334155] p-0.5">
                        <button
                            onClick={handleExportPDF}
                            disabled={isExporting || isExportingAll}
                            className="px-3 py-1.5 rounded-md hover:bg-[#334155] text-white text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
                            title="Export Current Scene"
                        >
                            {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                            <span>{t('sceneDetail', 'scene')}</span>
                        </button>
                        <div className="w-px h-4 bg-[#334155] mx-0.5" />
                        <button
                            onClick={handleExportProjectPDF}
                            disabled={isExporting || isExportingAll}
                            className="px-3 py-1.5 rounded-md hover:bg-[#334155] text-[#ff365c] hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
                            title="Export Whole Project"
                        >
                            {isExportingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                            <span>{t('sceneDetail', 'fullProject')}</span>
                        </button>
                    </div>

                    <div className="h-4 w-px bg-[#334155]" />
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {scene.time}</span>
                </div>
            </header>

            {/* Main Content Scrollable Area */}
            <div ref={mainContentRef} className="flex-1 overflow-y-auto custom-scrollbar relative">
                <main className="py-10 px-6 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* LEFT COLUMN: Script Reader */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="sticky top-6 space-y-4">
                            <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-8 shadow-xl max-h-[60vh] overflow-y-auto custom-scrollbar">
                                <div className="text-[10px] uppercase tracking-widest text-[#52525b] mb-6 font-bold border-b border-[#1f2937] pb-2">
                                    {t('sceneDetail', 'originalScriptContext')}
                                </div>
                                <div className="space-y-6 font-serif text-[#cbd5f5] leading-loose">
                                    {scene.script_blocks?.map((block: { type: string; text: string; speaker?: string }, idx: number) => {
                                        if (block.type === 'slugline') {
                                            return (
                                                <div key={idx} className="font-bold text-white uppercase tracking-widest text-sm border-b border-[#334155] pb-2 mb-4 mt-8">
                                                    {block.text}
                                                </div>
                                            );
                                        }
                                        if (block.type === 'dialogue') {
                                            return (
                                                <div key={idx} className="flex flex-col items-center text-center px-4 md:px-12 my-6">
                                                    <div className="text-[#ff365c] font-bold text-xs uppercase tracking-wider mb-1">{block.speaker}</div>
                                                    <div className="text-white/90">{block.text}</div>
                                                </div>
                                            );
                                        }
                                        return (
                                            <p key={idx} className="text-[#94a3b8]">
                                                {block.text}
                                            </p>
                                        );
                                    })}
                                    {!scene.script_blocks && (
                                        <p className="opacity-50 italic">Raw script context not available for this scene.</p>
                                    )}
                                </div>
                            </div>

                            {/* AI Assistant Chat Interface */}
                            <div className="bg-[#111827] border border-[#1f2937] rounded-xl flex flex-col shadow-xl h-[400px]">
                                <div className="p-4 border-b border-[#1f2937] flex items-center justify-between bg-[#0b0f17]/50 rounded-t-xl">
                                    <div className="text-[10px] uppercase tracking-widest text-[#ff365c] font-bold flex items-center gap-2">
                                        <MessageSquare className="w-3 h-3" /> {t('sceneDetail', 'aiAssistantDirector')}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {generatingCount > 0 && (
                                            <div className="flex items-center gap-2 px-2 py-0.5 bg-[#ff365c]/10 rounded border border-[#ff365c]/20">
                                                <Loader2 className="w-3 h-3 animate-spin text-[#ff365c]" />
                                                <span className="text-[8px] font-bold text-[#ff365c] uppercase tracking-widest">Generating {generatingCount} Shot{generatingCount > 1 ? 's' : ''}...</span>
                                            </div>
                                        )}
                                        <div className="text-[8px] text-[#52525b] uppercase font-bold px-2 py-0.5 border border-[#1f2937] rounded">
                                            {t('sceneDetail', 'beta')}
                                        </div>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                    {chatMessages.length === 0 && (
                                        <div className="text-center text-[#334155] text-xs mt-10 italic">
                                            Ask me to split shots, change angles, or refine the storyboard plan.
                                        </div>
                                    )}
                                    {chatMessages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`
                                            max-w-[85%] p-3 rounded-lg text-xs leading-relaxed
                                            ${msg.role === 'user'
                                                    ? 'bg-[#1f2937] text-white rounded-br-none border border-[#334155]'
                                                    : 'bg-[#0b0f17] text-[#94a3b8] rounded-bl-none border border-[#1f2937]'}
                                        `}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    {isChatting && (
                                        <div className="flex justify-start">
                                            <div className="bg-[#0b0f17] p-3 rounded-lg rounded-bl-none border border-[#1f2937]">
                                                <Loader2 className="w-3 h-3 animate-spin text-[#ff365c]" />
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-3 border-t border-[#1f2937] bg-[#0b0f17]/50 rounded-b-xl">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleChatSubmit();
                                                }
                                            }}
                                            placeholder={t('chat', 'placeholder')}
                                            className="w-full bg-[#020617] border border-[#334155] rounded-lg pl-3 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff365c] placeholder:text-[#334155]"
                                        />
                                        <button
                                            onClick={handleChatSubmit}
                                            disabled={!chatInput.trim() || isChatting}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#ff365c] hover:bg-[#ff365c]/10 rounded-md transition-colors disabled:opacity-50"
                                        >
                                            <Send className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Visuals & Shots */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest flex items-center gap-2">
                                <Camera className="w-4 h-4 text-[#ff365c]" />
                                {t('sceneDetail', 'shotList')} ({scene.shots.length})
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {scene.shots.map((shot: any, index: number) => {
                                const cached = (storyboardCache || {})[shot.id];
                                const isGen = generatingShotId === shot.id;

                                return (
                                    <div key={shot.id} className="group bg-[#020617] border border-[#1f2937] rounded-xl p-5 hover:border-[#334155] transition-all flex flex-col gap-5">

                                        {/* Header */}
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[#ff365c] font-black">{shot.id}</span>
                                                <span className="px-2 py-0.5 rounded bg-[#1f2937] text-[10px] font-bold text-[#94a3b8] border border-[#334155] uppercase">{shot.type}</span>
                                                <span className="px-2 py-0.5 rounded bg-[#1f2937] text-[10px] font-bold text-[#94a3b8] border border-[#334155] uppercase">{shot.camera}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {cached && (
                                                    <button
                                                        onClick={() => handleGenerateStoryboard(shot, true)}
                                                        disabled={isGen}
                                                        className="p-2 text-[#475569] hover:text-[#ff365c] hover:bg-[#ff365c]/10 rounded-full transition-colors disabled:opacity-50"
                                                        title="Regenerate Visuals"
                                                    >
                                                        <RefreshCw className={`w-4 h-4 ${isGen ? 'animate-spin' : ''}`} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p className="text-sm text-[#cbd5f5] leading-relaxed pl-8 border-l-2 border-[#1f2937]">
                                            {shot.description}
                                        </p>

                                        {/* Visuals */}
                                        <div className="pl-8">
                                            {cached ? (
                                                <div className="grid grid-cols-3 gap-3">
                                                    {cached.map((sb: any, i: number) => {
                                                        const isCover = scene.selectedThumbnailUrl === sb.imageUrl;
                                                        const isSelectedForShot = shot.selectedImageUrl === sb.imageUrl;

                                                        return (
                                                            <div
                                                                key={sb.variant || i}
                                                                className={`
                                                                relative aspect-video bg-black rounded-lg overflow-hidden border transition-all cursor-pointer group/img
                                                                ${isSelectedForShot ? 'border-[#ff365c] ring-2 ring-[#ff365c]/50' : 'border-[#334155] hover:border-white/50'}
                                                            `}
                                                            >
                                                                <img
                                                                    src={sb.imageUrl}
                                                                    loading="lazy"
                                                                    className="w-full h-full object-cover"
                                                                    alt={`Storyboard ${shot.id}`}
                                                                    onClick={() => setSelectedImage(sb.imageUrl)}
                                                                />


                                                                {/* Actions Overlay */}
                                                                <div className="absolute top-2 right-2 flex gap-2">

                                                                    {/* Select for Timeline (Primary) */}
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            selectShotImage?.(scene.id, shot.id, sb.imageUrl);
                                                                        }}
                                                                        className={`
                                                                        p-1.5 rounded-md backdrop-blur-md transition-all
                                                                        ${isSelectedForShot ? 'bg-[#ff365c] text-white' : 'bg-black/50 text-white opacity-0 group-hover/img:opacity-100 hover:bg-[#ff365c]'}
                                                                    `}
                                                                        title="Select for Storyboard Sequence"
                                                                    >
                                                                        <Check className="w-3 h-3" />
                                                                    </button>

                                                                    {/* Set as Scene Cover (Secondary) */}
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            selectSceneThumbnail?.(scene.id, sb.imageUrl);
                                                                        }}
                                                                        className={`
                                                                        p-1.5 rounded-md backdrop-blur-md transition-all
                                                                        ${isCover ? 'bg-blue-600 text-white' : 'bg-black/50 text-white opacity-0 group-hover/img:opacity-100 hover:bg-blue-600'}
                                                                    `}
                                                                        title="Set as Scene Thumbnail (Cover)"
                                                                    >
                                                                        <Maximize2 className="w-3 h-3" />
                                                                    </button>
                                                                </div>

                                                                {isSelectedForShot && (
                                                                    <div className="absolute bottom-2 left-2 bg-[#ff365c] text-[8px] font-black px-1.5 py-0.5 rounded text-white tracking-widest uppercase">
                                                                        In Sequence
                                                                    </div>
                                                                )}
                                                                {isCover && !isSelectedForShot && (
                                                                    <div className="absolute bottom-2 left-2 bg-blue-600 text-[8px] font-black px-1.5 py-0.5 rounded text-white tracking-widest uppercase">
                                                                        Cover
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleGenerateStoryboard(shot)}
                                                    disabled={isGen}
                                                    className={`
                                                    w-full h-32 border-2 border-dashed border-[#1f2937] rounded-xl flex flex-col items-center justify-center gap-2
                                                    hover:border-[#ff365c]/40 hover:bg-[#ff365c]/5 transition-all text-[#64748b] group-hover:text-[#94a3b8]
                                                    ${isGen ? 'opacity-50 cursor-not-allowed' : ''}
                                                `}
                                                >
                                                    {isGen ? (
                                                        <div className="flex flex-col items-center gap-2">
                                                            <Loader2 className="w-6 h-6 animate-spin text-[#ff365c]" />
                                                            <span className="text-xs font-bold text-[#ff365c]">{t('sceneDetail', 'generating')}</span>
                                                            <span className="text-[10px] text-[#52525b]">This may take up to 20s</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <ImagePlus className="w-6 h-6" />
                                                            <span className="text-xs font-bold uppercase tracking-widest">{t('sceneDetail', 'generateVisuals')}</span>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* BOTTOM: Visual Storyboard Timeline - Full Width */}
                    <div className="col-span-1 lg:col-span-12 mt-10 border-t border-[#1f2937] pt-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="text-[10px] uppercase tracking-widest text-[#ff365c] font-bold flex items-center gap-2">
                                    <Film className="w-4 h-4" /> Storyboard Sequence
                                </div>
                                <div className="h-px w-32 bg-[#1f2937]" />
                            </div>
                        </div>

                        <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar">
                            {scene.shots.map((shot: any, idx: number) => (
                                <div key={shot.id} className="min-w-[200px] w-[200px] flex flex-col gap-2 group">
                                    <div className="aspect-video bg-[#020617] rounded-lg border border-[#334155] overflow-hidden relative">
                                        {shot.selectedImageUrl ? (
                                            <img src={shot.selectedImageUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[#334155]">
                                                <ImagePlus className="w-6 h-6 opacity-20" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2 bg-black/50 backdrop-blur px-1.5 py-0.5 rounded text-[10px] font-mono text-white">
                                            {shot.id}
                                        </div>
                                    </div>
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-[10px] text-[#94a3b8] line-clamp-2 leading-tight flex-1">
                                            {shot.description}
                                        </p>
                                        <div className="text-[9px] font-mono text-[#52525b] uppercase border border-[#1f2937] px-1 rounded">
                                            {shot.type.substring(0, 4)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </main >
            </div>
        </div >
    );
}
