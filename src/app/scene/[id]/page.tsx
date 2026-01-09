"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useScreenplay } from '@/context/ScreenplayContext';
import {
    ArrowLeft,
    MapPin,
    Clock,
    Camera,
    Loader2,
    ImagePlus,
    Film,
    RefreshCw,
    Maximize2
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function SceneDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { scenes, storyboardCache, updateStoryboardCache } = useScreenplay();
    const [generatingShotId, setGeneratingShotId] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const sceneId = typeof params.id === 'string' ? decodeURIComponent(params.id) : '';
    const scene = scenes.find(s => s.id === sceneId);

    // Redirect if no scene found
    if (!scene && scenes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#0b0f17] text-[#94a3b8] gap-4">
                <Film className="w-12 h-12 text-[#334155]" />
                <p>No scene data found. Please return to workspace.</p>
                <button
                    onClick={() => router.push('/')}
                    className="px-6 py-2 bg-[#1f2937] hover:bg-[#334155] rounded-xl text-white text-sm transition-colors border border-[#334155]"
                >
                    Go to Workspace
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
                    <p className="text-[#94a3b8] text-sm font-mono">
                        Target ID: <span className="text-[#ff365c]">{sceneId}</span>
                    </p>
                    <div className="text-xs text-[#52525b] border-t border-[#1f2937] pt-4 mt-4">
                        <p className="mb-2 font-bold">Debug Info - Available Scenes:</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {scenes.map(s => (
                                <span key={s.id} className="bg-[#1f2937] px-2 py-1 rounded text-xs text-[#94a3b8]">{s.id}</span>
                            ))}
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => router.push('/')}
                    className="mt-8 px-6 py-2 bg-[#1f2937] hover:bg-[#334155] rounded-xl text-white text-sm transition-colors border border-[#334155]"
                >
                    Return to Workspace
                </button>
            </div>
        );
    }

    const handleGenerateStoryboard = async (shot: any, forceRegenerate = false) => {
        if (generatingShotId) return;

        setGeneratingShotId(shot.id);
        try {
            const response = await fetch('/api/storyboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shotId: shot.id,
                    sceneContext: {
                        location: scene.location,
                        time: scene.time || "Day",
                        emotion: []
                    },
                    shot: {
                        type: shot.type,
                        camera: shot.camera,
                        description: shot.description
                    }
                })
            });

            if (!response.ok) throw new Error('Generation failed');

            const data = await response.json();
            if (data.storyboards) {
                updateStoryboardCache(shot.id, data.storyboards);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to generate storyboard.");
        } finally {
            setGeneratingShotId(null);
        }
    };

    return (
        <div className="bg-[#0b0f17] min-h-screen text-[#e8eefc] font-sans">

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

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-[#0b0f17]/90 backdrop-blur-md border-b border-[#1f2937] flex items-center px-6 z-50">
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
                <div className="ml-auto flex items-center gap-4 text-xs font-mono text-[#94a3b8]">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {scene.time}</span>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-24 pb-20 px-6 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* LEFT COLUMN: Script Reader */}
                <div className="lg:col-span-5 space-y-8">
                    <div className="sticky top-24">
                        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-8 shadow-xl max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <div className="text-[10px] uppercase tracking-widest text-[#52525b] mb-6 font-bold border-b border-[#1f2937] pb-2">
                                Original Script Context
                            </div>
                            <div className="space-y-6 font-serif text-[#cbd5f5] leading-loose">
                                {scene.script_blocks?.map((block, idx) => {
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
                    </div>
                </div>

                {/* RIGHT COLUMN: Visuals & Shots */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest flex items-center gap-2">
                            <Camera className="w-4 h-4 text-[#ff365c]" />
                            Shot List ({scene.shots.length})
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {scene.shots.map((shot) => {
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

                                    {/* Description */}
                                    <p className="text-sm text-[#cbd5f5] leading-relaxed pl-8 border-l-2 border-[#1f2937]">
                                        {shot.description}
                                    </p>

                                    {/* Visuals */}
                                    <div className="pl-8">
                                        {cached ? (
                                            <div className="grid grid-cols-3 gap-3">
                                                {cached.map((sb: any, i: number) => (
                                                    <div
                                                        key={sb.variant || i}
                                                        onClick={() => setSelectedImage(sb.imageUrl)}
                                                        className="aspect-video bg-black rounded-lg overflow-hidden border border-[#334155] relative group/img cursor-zoom-in hover:border-white/50 transition-all"
                                                    >
                                                        {/* Lazy load image, immediate text feedback if fail */}
                                                        <img
                                                            src={sb.imageUrl}
                                                            loading="lazy"
                                                            className="w-full h-full object-cover"
                                                            alt={`Storyboard ${shot.id}`}
                                                        />
                                                    </div>
                                                ))}
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
                                                        <span className="text-xs font-bold text-[#ff365c]">Generating Visuals...</span>
                                                        <span className="text-[10px] text-[#52525b]">This may take up to 20s</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <ImagePlus className="w-6 h-6" />
                                                        <span className="text-xs font-bold uppercase tracking-widest">Generate Visuals</span>
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

            </main>
        </div>
    );
}
