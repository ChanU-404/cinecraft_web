import { useState } from 'react';
import { LightingSpatialSpecification } from '@/types/lss';
import { LightingSpecSheet } from './LightingSpecSheet';
import { LightingReasoningView } from './LightingReasoningView'; // New Import
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, List } from 'lucide-react';

interface LightingAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    data?: LightingSpatialSpecification;
    imageUrl?: string;
}

export function LightingAnalysisModal({ isOpen, onClose, data, imageUrl }: LightingAnalysisModalProps) {
    const [viewMode, setViewMode] = useState<'journal' | 'specs'>('journal'); // Default to Journal

    if (!isOpen || !data) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#020617] border border-[#334155] rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 border-b border-[#334155] bg-[#0f172a]">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-bold text-white pl-2">Technical Board</h2>

                            {/* Toggle Switch */}
                            <div className="flex bg-black/50 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode('journal')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'journal' ? 'bg-[#3b82f6] text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    <FileText className="w-4 h-4" /> Gaffer's Log
                                </button>
                                <button
                                    onClick={() => setViewMode('specs')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'specs' ? 'bg-[#3b82f6] text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    <List className="w-4 h-4" /> LSS Spec
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content Body */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* LEFT: Context Image (Always Visible) */}
                        {imageUrl && (
                            <div className="w-[300px] bg-black border-r border-[#334155] p-4 flex flex-col gap-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Reference Frame</h3>
                                <div className="rounded-lg overflow-hidden border border-[#334155]">
                                    <img src={imageUrl} alt="Ref" className="w-full opacity-90" />
                                </div>
                                <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded text-xs text-blue-200/70">
                                    <p>{viewMode === 'journal' ? "Reading the Gaffer's decision log..." : "Reviewing strict technical specifications..."}</p>
                                </div>
                            </div>
                        )}

                        {/* RIGHT: Main View (Toggled) */}
                        <div className="flex-1 bg-[#111] overflow-hidden relative">
                            {viewMode === 'journal' ? (
                                <LightingReasoningView data={data} />
                            ) : (
                                <LightingSpecSheet data={data} />
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
