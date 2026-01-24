"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useScreenplay } from '@/context/ScreenplayContext';
import { generateDraftSchedule } from '@/lib/production/scheduler';
import { ProductionDocModel } from '@/lib/production/types';
import { generateCallSheetPDF } from '@/lib/renderers/pdfRenderer';
import { generateScheduleXLSX } from '@/lib/renderers/xlsxRenderer';
import { Calendar, FileSpreadsheet, FileText, ArrowLeft, RefreshCw, Save, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductionChat } from '@/components/production/ProductionChat';

export default function ProductionPage() {
    const params = useParams();
    const router = useRouter();
    const { projects, loadProject, currentProjectId, scenes } = useScreenplay();

    // Local State
    const [docData, setDocData] = useState<ProductionDocModel | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showChat, setShowChat] = useState(false);

    const projectId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : null;

    useEffect(() => {
        if (projectId && (!currentProjectId || currentProjectId !== projectId)) {
            loadProject(projectId);
        }
    }, [projectId, currentProjectId]);

    // Initialize/Generate logic
    const handleGenerate = () => {
        if (!currentProjectId) return;
        const project = projects.find(p => p.id === currentProjectId);
        if (!project) return;

        setIsLoading(true);
        // Simulate "Processing" time
        setTimeout(() => {
            const draft = generateDraftSchedule(project, scenes);
            setDocData(draft);
            setIsLoading(false);
        }, 800);
    };

    if (!projectId) return <div>Invalid Project ID</div>;

    const currentProject = projects.find(p => p.id === projectId);

    return (
        <div className="min-h-screen bg-[#020617] text-white flex flex-col relative overflow-hidden">
            {/* Header */}
            <header className="h-16 border-b border-[#1f2937] flex items-center px-6 gap-4 bg-[#0f172a] z-50">
                <button onClick={() => router.push('/')} className="p-2 hover:bg-[#1e293b] rounded-full">
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
                <h1 className="text-lg font-bold">Production Docs: {currentProject?.title || "Untitled"}</h1>
                <div className="ml-auto flex gap-2">
                    {docData && (
                        <>
                            <button
                                onClick={() => setShowChat(!showChat)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${showChat ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#1f2937] hover:bg-[#334155] text-gray-300'
                                    }`}
                            >
                                <Sparkles className="w-4 h-4" />
                                AI Copilot
                            </button>
                            <div className="w-px h-6 bg-[#334155] mx-2" />
                            <button
                                onClick={() => generateScheduleXLSX(docData)}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg text-sm font-bold"
                            >
                                <FileSpreadsheet className="w-4 h-4" /> Export XLSX
                            </button>
                            <button
                                onClick={() => generateCallSheetPDF(docData)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-bold"
                            >
                                <FileText className="w-4 h-4" /> Export PDF
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {!docData ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-6">
                            <div className="bg-[#1e293b] p-8 rounded-2xl border border-[#334155] max-w-lg w-full text-center shadow-xl">
                                <Calendar className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold mb-2">Create Shooting Schedule</h2>
                                <p className="text-gray-400 mb-8">
                                    AI will analyze your {scenes.length} scenes to create an optimized schedule and call sheet draft.
                                </p>

                                <button
                                    onClick={handleGenerate}
                                    disabled={isLoading}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all"
                                >
                                    {isLoading ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 animate-spin" /> Generating...
                                        </>
                                    ) : (
                                        "Generate Draft Schedule"
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-5xl mx-auto space-y-8">
                            {/* Editor View (MVP: Read-only preview mostly, simple edits) */}
                            <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
                                <div className="p-4 border-b border-[#334155] bg-[#0f172a] flex justify-between items-center">
                                    <h3 className="font-bold">Day 1 Schedule</h3>
                                    <div className="text-sm text-gray-400">
                                        {docData.shootDay.date} • Call: {docData.shootDay.callTime}
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-[#0f172a] text-gray-400 font-medium">
                                            <tr>
                                                <th className="px-4 py-3">Time</th>
                                                <th className="px-4 py-3">Activity / Scene</th>
                                                <th className="px-4 py-3">Location</th>
                                                <th className="px-4 py-3">Dur</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#334155]">
                                            {docData.timetable.map(block => (
                                                <tr key={block.id} className="hover:bg-[#334155]/30">
                                                    <td className="px-4 py-3 font-mono text-emerald-400">{block.time}</td>
                                                    <td className="px-4 py-3 font-medium text-white">
                                                        {block.activityLabel}
                                                        {block.memo && <div className="text-xs text-gray-500 mt-1">{block.memo}</div>}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-300">{block.location || '-'}</td>
                                                    <td className="px-4 py-3 text-gray-400">{block.duration}m</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Scenes List */}
                            <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
                                <div className="p-4 border-b border-[#334155] bg-[#0f172a]">
                                    <h3 className="font-bold">Scheduled Scenes</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-[#0f172a] text-gray-400 font-medium">
                                            <tr>
                                                <th className="px-4 py-3">#</th>
                                                <th className="px-4 py-3">Slugline</th>
                                                <th className="px-4 py-3">I/E</th>
                                                <th className="px-4 py-3">D/N</th>
                                                <th className="px-4 py-3">Cast</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#334155]">
                                            {docData.scenes.map(scene => (
                                                <tr key={scene.id} className="hover:bg-[#334155]/30">
                                                    <td className="px-4 py-3 text-gray-400">{scene.order}</td>
                                                    <td className="px-4 py-3 font-bold text-white">
                                                        {scene.sluglineTitle}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-300">{scene.intExt}</td>
                                                    <td className={`px-4 py-3 font-bold ${scene.dayNight === 'NIGHT' ? 'text-indigo-400' : 'text-amber-400'}`}>
                                                        {scene.dayNight}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-400 truncate max-w-[200px]">
                                                        {scene.characters.join(', ')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* AI Chat Sidebar */}
                <AnimatePresence>
                    {showChat && docData && (
                        <ProductionChat
                            docData={docData}
                            onUpdate={(newDoc) => setDocData(newDoc)}
                            onClose={() => setShowChat(false)}
                        />
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
