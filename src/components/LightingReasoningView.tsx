import React from 'react';
import { LightingSpatialSpecification } from '@/types/lss';
import { FileText, Calendar, PenTool } from 'lucide-react';

interface LightingReasoningViewProps {
    data: LightingSpatialSpecification;
}

export function LightingReasoningView({ data }: LightingReasoningViewProps) {
    if (!data.journal) return null;

    return (
        <div className="w-full h-full bg-[#f8f8f8] text-[#333] overflow-y-auto custom-scrollbar p-10 font-serif">

            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-10 flex items-center justify-between border-b-2 border-black pb-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2 font-sans">Gaffer's Log</h1>
                        <p className="text-sm text-gray-500 font-sans uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> {new Date().toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {/* The Narrative Journal */}
                <div className="prose prose-lg prose-slate leading-relaxed mb-12">
                    {data.journal.split('\n').map((paragraph, idx) => (
                        <p key={idx} className="mb-6 first-letter:float-left first-letter:text-5xl first-letter:pr-2 first-letter:font-bold first-letter:text-black">
                            {paragraph}
                        </p>
                    ))}
                </div>

                {/* Core Intention Footer */}
                <div className="bg-white border-l-4 border-black p-6 shadow-sm italic text-lg leading-relaxed text-gray-700">
                    <span className="block text-xs font-bold not-italic font-sans uppercase text-gray-400 mb-2">Core Intention</span>
                    "{data.core_intention}"
                </div>

                {/* Signature (Atmosphere) */}
                <div className="mt-12 flex justify-end">
                    <div className="text-right">
                        <div className="h-px w-24 bg-black mb-2 ml-auto"></div>
                        <p className="text-xs font-sans uppercase tracking-widest text-gray-500">Documented by</p>
                        <p className="font-bold font-sans">AI Gaffer Logic</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
