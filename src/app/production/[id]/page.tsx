"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useScreenplay } from '@/context/ScreenplayContext';
import { generateDraftSchedule } from '@/lib/production/scheduler';
import { ProductionDocModel } from '@/lib/production/types';
import { generateCallSheetPDF, generateShootingSchedulePDF } from '@/lib/renderers/pdfRenderer';
import { generateScheduleXLSX } from '@/lib/renderers/xlsxRenderer';
import { Calendar, FileSpreadsheet, FileText, ArrowLeft, RefreshCw, Save, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductionChat } from '@/components/production/ProductionChat';
import { ProductionSetupModal } from '@/components/production/ProductionSetupModal';

export default function ProductionPage() {
    const params = useParams();
    const router = useRouter();
    const { projects, loadProject, currentProjectId, scenes } = useScreenplay();

    // Local State
    const [docData, setDocData] = useState<ProductionDocModel | null>(null);
    const [activeDayIndex, setActiveDayIndex] = useState(0); // Day Switcher
    const [isLoading, setIsLoading] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showSetup, setShowSetup] = useState(false);

    const projectId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : null;

    // Derived unique locations for setup
    const uniqueLocations = React.useMemo(() => {
        return Array.from(new Set(scenes.map(s => s.location.split('-')[0].trim())));
    }, [scenes]);

    useEffect(() => {
        if (projectId && (!currentProjectId || currentProjectId !== projectId)) {
            loadProject(projectId);
        }
    }, [projectId, currentProjectId]);

    // Initialize logic
    const handleStartSetup = () => {
        setShowSetup(true);
    };

    const handleSetupComplete = (options: any) => {
        setShowSetup(false);
        if (!currentProjectId) return;

        const project = projects.find(p => p.id === currentProjectId);
        if (!project) return;

        setIsLoading(true);
        // Simulate "Processing" time
        setTimeout(() => {
            try {
                const draft = generateDraftSchedule(project, scenes, options);
                setDocData(draft);
                setActiveDayIndex(0);
            } catch (error) {
                console.error("Failed to generate schedule:", error);
                alert("Failed to generate schedule. Please try again with different settings.");
            } finally {
                setIsLoading(false);
            }
        }, 800);
    };

    if (!projectId) return <div>Invalid Project ID</div>;

    const currentProject = projects.find(p => p.id === projectId);
    const activeDay = docData?.days?.[activeDayIndex];

    return (
        <div className="h-screen bg-[#020617] text-white flex flex-col overflow-hidden">
            {/* Header */}
            <header className="h-16 shrink-0 border-b border-[#1f2937] flex items-center px-6 gap-4 bg-[#0f172a] z-50">
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
                                onClick={() => generateShootingSchedulePDF(docData)}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg text-sm font-bold"
                            >
                                <FileSpreadsheet className="w-4 h-4" /> 일촬표 PDF
                            </button>
                            <button
                                onClick={() => generateCallSheetPDF(docData)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-bold"
                            >
                                <FileText className="w-4 h-4" /> 콜시트 PDF
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Main Content - Fixed Scroll */}
            <main className="flex-1 relative overflow-hidden flex flex-col">
                <div className="absolute inset-0 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    {!docData ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-6 min-h-[500px]">
                            <div className="bg-[#1e293b] p-8 rounded-2xl border border-[#334155] max-w-lg w-full text-center shadow-xl">
                                <Calendar className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold mb-2">촬영 스케줄(일촬표) 생성</h2>
                                <p className="text-gray-400 mb-8">
                                    AI가 {scenes.length} 개의 씬을 분석하여 최적화된 스케줄을 생성합니다. <br />
                                    먼저 몇 가지 기본 설정을 진행해 주세요.
                                </p>

                                <button
                                    onClick={handleStartSetup}
                                    disabled={isLoading}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all"
                                >
                                    {isLoading ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 animate-spin" /> 생성 중...
                                        </>
                                    ) : (
                                        "스케줄 설정 시작하기"
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-5xl mx-auto space-y-8">
                            {/* Day Switcher Tabs */}
                            {docData.days.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {docData.days.map((day, idx) => (
                                        <button
                                            key={day.id}
                                            onClick={() => setActiveDayIndex(idx)}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all
                                                ${activeDayIndex === idx
                                                    ? 'bg-[#ff365c] text-white'
                                                    : 'bg-[#1e293b] text-gray-400 hover:bg-[#334155]'}`}
                                        >
                                            Day {day.dayNumber} ({day.date})
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Editor View */}
                            {activeDay && (
                                <>
                                    <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
                                        <div className="p-4 border-b border-[#334155] bg-[#0f172a] flex justify-between items-center">
                                            <h3 className="font-bold">Day {activeDay.dayNumber} Schedule</h3>
                                            <div className="text-sm text-gray-400">
                                                {activeDay.shootDay.date} • Call: {activeDay.shootDay.callTime} • Loc: {activeDay.shootDay.mainLocation.name}
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
                                                    {activeDay.timetable.map(block => (
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
                                            <h3 className="font-bold">Scheduled Scenes (Day {activeDay.dayNumber})</h3>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-[#0f172a] text-gray-400 font-medium">
                                                    <tr>
                                                        <th className="px-4 py-3">#</th>
                                                        <th className="px-4 py-3">Slugline</th>
                                                        <th className="px-4 py-3">I/E</th>
                                                        <th className="px-4 py-3">D/N</th>
                                                        <th className="px-4 py-3">Loc</th>
                                                        <th className="px-4 py-3">Cast</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#334155]">
                                                    {activeDay.scenes.map(scene => (
                                                        <tr key={scene.id} className="hover:bg-[#334155]/30">
                                                            <td className="px-4 py-3 text-gray-400">{scene.order}</td>
                                                            <td className="px-4 py-3 font-bold text-white">
                                                                {scene.sluglineTitle}
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-300">{scene.intExt}</td>
                                                            <td className={`px-4 py-3 font-bold ${scene.dayNight === 'NIGHT' ? 'text-indigo-400' : 'text-amber-400'}`}>
                                                                {scene.dayNight}
                                                            </td>
                                                            <td className="px-4 py-3 text-emerald-400 font-mono text-xs">
                                                                {scene.locationName}
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

                                    {/* Cast Call Editor */}
                                    <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
                                        <div className="p-4 border-b border-[#334155] bg-[#0f172a]">
                                            <h3 className="font-bold">Cast Call (Day {activeDay.dayNumber})</h3>
                                            <p className="text-xs text-gray-400 mt-1">Edit actor names, costume, and makeup notes</p>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            {activeDay.castCalls.map((cast, idx) => (
                                                <div key={idx} className="bg-[#0b0f17] rounded-lg p-4 border border-[#334155]">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">
                                                                Character
                                                            </label>
                                                            <div className="text-white font-bold">{cast.characterName}</div>
                                                            <div className="text-xs text-gray-500 mt-1">Call: {cast.callTime}</div>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">
                                                                Actor Name
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={cast.actorName || ''}
                                                                onChange={(e) => {
                                                                    const updated = { ...docData };
                                                                    updated.days[activeDayIndex].castCalls[idx].actorName = e.target.value;
                                                                    setDocData(updated);
                                                                }}
                                                                placeholder="배우 이름 입력"
                                                                className="w-full bg-[#1e293b] border border-[#334155] rounded px-3 py-2 text-white text-sm focus:border-[#ff365c] focus:outline-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">
                                                                Costume Notes
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={cast.costume || ''}
                                                                onChange={(e) => {
                                                                    const updated = { ...docData };
                                                                    updated.days[activeDayIndex].castCalls[idx].costume = e.target.value;
                                                                    setDocData(updated);
                                                                }}
                                                                placeholder="의상 특이사항"
                                                                className="w-full bg-[#1e293b] border border-[#334155] rounded px-3 py-2 text-white text-sm focus:border-[#ff365c] focus:outline-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">
                                                                Makeup Notes
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={cast.makeup || ''}
                                                                onChange={(e) => {
                                                                    const updated = { ...docData };
                                                                    updated.days[activeDayIndex].castCalls[idx].makeup = e.target.value;
                                                                    setDocData(updated);
                                                                }}
                                                                placeholder="분장 특이사항"
                                                                className="w-full bg-[#1e293b] border border-[#334155] rounded px-3 py-2 text-white text-sm focus:border-[#ff365c] focus:outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
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

                {/* Setup Modal */}
                <AnimatePresence>
                    {showSetup && (
                        <ProductionSetupModal
                            isOpen={showSetup}
                            onClose={() => setShowSetup(false)}
                            onComplete={handleSetupComplete}
                            uniqueLocations={uniqueLocations}
                            scenes={scenes}
                        />
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
