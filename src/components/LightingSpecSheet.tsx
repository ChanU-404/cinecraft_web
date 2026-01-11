import React from 'react';
import { LightingSpatialSpecification } from '@/types/lss';
import { Grid, Activity, User, Sun, Maximize, Camera } from 'lucide-react';

interface LightingSpecSheetProps {
    data: LightingSpatialSpecification;
}

const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 mb-3 border-b border-gray-700 pb-2 mt-6 first:mt-0">
        <Icon className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-bold text-gray-200 uppercase tracking-widest">{title}</h3>
    </div>
);

const SpecRow = ({ label, value }: { label: string, value: string | number }) => (
    <div className="flex flex-col mb-2">
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</span>
        <span className="text-sm text-gray-300 font-mono border-l-2 border-gray-700 pl-2">{value}</span>
    </div>
);

export function LightingSpecSheet({ data }: LightingSpecSheetProps) {
    if (!data) return null;

    return (
        <div className="w-full h-full bg-[#111] text-gray-300 overflow-y-auto custom-scrollbar p-6 font-sans">

            {/* Header */}
            <div className="mb-8 border-b-2 border-white/10 pb-4">
                <h1 className="text-2xl font-bold text-white mb-1">LIGHTING SPATIAL SPECIFICATION</h1>
                <p className="text-xs text-gray-500 font-mono">LSS-2024-GEN-001 • SOURCE OF TRUTH</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* COLUMN 1: Space & Camera */}
                <div>
                    <SectionHeader icon={Maximize} title="Space Definition" />
                    <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-lg border border-white/5">
                        <SpecRow label="Type" value={data.space.type} />
                        <SpecRow label="Shape" value={data.space.shape} />
                        <SpecRow label="Dimensions" value={data.space.size} />
                        <SpecRow label="Ceiling" value={data.space.ceilingHeight} />
                        <div className="col-span-2">
                            <SpecRow label="Practicals" value={data.space.practicalSources.join(", ") || "None"} />
                        </div>
                    </div>

                    <SectionHeader icon={Camera} title="Camera Specification" />
                    <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-lg border border-white/5">
                        <SpecRow label="Position" value={data.camera.position} />
                        <SpecRow label="Height" value={data.camera.height} />
                        <SpecRow label="Dist. to Subject" value={data.camera.distanceToSubject} />
                        <SpecRow label="Lens" value={data.camera.lens} />
                        <SpecRow label="Framing" value={data.camera.framing} />
                        <SpecRow label="Viewing Dir" value={data.camera.viewingDirection} />
                    </div>

                    <SectionHeader icon={User} title="Subject" />
                    <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-lg border border-white/5">
                        <SpecRow label="Count" value={data.subject.count} />
                        <SpecRow label="Pose" value={data.subject.pose} />
                        <div className="col-span-2">
                            <SpecRow label="Lighting Priority" value={data.subject.lightingPriority} />
                        </div>
                    </div>
                </div>

                {/* COLUMN 2: Lighting Manifest */}
                <div>
                    <SectionHeader icon={Sun} title="Lighting Manifest" />
                    <div className="flex flex-col gap-4">
                        {data.lighting.map((light, idx) => (
                            <div key={idx} className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 relative overflow-hidden group hover:border-gray-600 transition-colors">
                                {/* Type Indicator Strip */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${light.type === 'Motivated' ? 'bg-orange-500' :
                                        light.type === 'Practical' ? 'bg-yellow-500' :
                                            light.type === 'Control' ? 'bg-red-500' : 'bg-blue-500'
                                    }`} />

                                <div className="flex justify-between items-start mb-2 pl-3">
                                    <h4 className="font-bold text-white text-lg">{light.id} <span className="text-gray-500 text-sm font-normal">| {light.name}</span></h4>
                                    <span className="text-[10px] uppercase bg-gray-800 px-2 py-1 rounded text-gray-400">{light.type}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 pl-3 text-sm">
                                    <div className="col-span-2">
                                        <span className="text-xs text-gray-500 block">Tool</span>
                                        <span className="text-yellow-400 font-mono">{light.tool}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 block">Position</span>
                                        <span>{light.position}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 block">Height</span>
                                        <span>{light.height}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 block">Quality</span>
                                        <span>{light.quality}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 block">Intensity</span>
                                        <span>{light.intensity || "N/A"}</span>
                                    </div>
                                    <div className="col-span-2 mt-2 pt-2 border-t border-gray-800">
                                        <span className="text-xs text-gray-500 block">Purpose</span>
                                        <span className="text-gray-400 italic">{light.purpose}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
