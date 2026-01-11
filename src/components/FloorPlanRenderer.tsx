import React from 'react';
import { FloorPlanData } from '@/types/floor-plan';

interface FloorPlanRendererProps {
    data: FloorPlanData;
    width?: number;
    height?: number;
}

export function FloorPlanRenderer({ data, width = 400, height = 400 }: FloorPlanRendererProps) {
    if (!data) return <div className="text-xs text-gray-500">No Data</div>;

    const { space, characters, observers, boundaries, lights } = data;

    // Calculate scaling factor to fit space into SVG viewbox
    const padding = 2; // Increase padding for labels
    const viewBoxX = -padding;
    const viewBoxY = -padding;
    const viewBoxW = space.width + (padding * 2);
    const viewBoxH = space.height + (padding * 2);

    return (
        <svg
            width="100%"
            height="100%"
            viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxW} ${viewBoxH}`}
            className="bg-white border border-[#333] select-none"
            style={{ fontFamily: 'Arial, sans-serif' }}
        >
            {/* Grid / Floor (Subtle) */}
            <rect x="0" y="0" width={space.width} height={space.height} fill="none" stroke="#eee" strokeWidth="0.05" />

            {/* Boundaries / Obstacles */}
            {boundaries?.map((b, i) => (
                <polyline
                    key={`b-${i}`}
                    points={b.points.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="#111"
                    strokeWidth="0.1"
                />
            ))}

            {/* Lights & Modifiers */}
            {lights?.map((light, i) => (
                <g key={`l-${i}`} transform={`translate(${light.position.x}, ${light.position.y}) rotate(${light.facing})`}>
                    {/* Fixture Symbol */}
                    {light.type === 'fixture' && (
                        <g>
                            {/* Generic Fixture Icon (Yoke + Body) */}
                            <path d="M-0.3,-0.3 L0.3,-0.3 L0.3,0.3 L-0.3,0.3 Z" fill="none" stroke="#4a5568" strokeWidth="0.05" />
                            <line x1="-0.4" y1="0" x2="-0.3" y2="0" stroke="#4a5568" strokeWidth="0.05" />
                            <line x1="0.3" y1="0" x2="0.4" y2="0" stroke="#4a5568" strokeWidth="0.05" />
                            <rect x="-0.2" y="-0.2" width="0.4" height="0.4" fill="#f6e05e" stroke="none" />
                        </g>
                    )}

                    {/* Modifier Symbol (e.g. Bounce, Grid) */}
                    {light.type === 'modifier' && (
                        <g>
                            {/* Thick line for frames/flags */}
                            <line x1="-1" y1="0" x2="1" y2="0" stroke={light.label?.toLowerCase().includes("solid") ? "#e53e3e" : "#48bb78"} strokeWidth="0.15" />
                            {/* Frame edges */}
                            <line x1="-1" y1="0" x2="-0.8" y2="0.3" stroke="#48bb78" strokeWidth="0.05" />
                            <line x1="1" y1="0" x2="0.8" y2="0.3" stroke="#48bb78" strokeWidth="0.05" />
                        </g>
                    )}

                    {/* Label (Rotated back to be upright if desired, or kept relative) */}
                    {/* For readability, we often want labels to be horizontal. We can use a foreignObject or negate rotation. */}
                    {light.label && (
                        <g transform={`rotate(${-light.facing}) translate(0, 0.8)`}>
                            <rect
                                x={-(light.label.length * 0.15)} y="-0.3"
                                width={light.label.length * 0.3} height="0.5"
                                fill={light.type === 'fixture' ? "#fefcbf" : light.type === 'modifier' && light.label.toLowerCase().includes("solid") ? "#fff" : "#f0fff4"}
                                stroke="none"
                            />
                            <text
                                fontSize="0.25"
                                textAnchor="middle"
                                fill={light.label.toLowerCase().includes("solid") ? "#e53e3e" : "#000"}
                                fontWeight="bold"
                            >
                                {light.label}
                            </text>
                        </g>
                    )}
                </g>
            ))}

            {/* Characters */}
            {characters?.map((char, i) => (
                <g key={`c-${i}`} transform={`translate(${char.position.x}, ${char.position.y})`}>
                    <circle r="0.3" fill="#e2e8f0" stroke="#2d3748" strokeWidth="0.05" />
                    <line
                        x1="0" y1="0"
                        x2={0.4 * Math.sin(char.facing * Math.PI / 180)}
                        y2={-0.4 * Math.cos(char.facing * Math.PI / 180)}
                        stroke="#2d3748"
                        strokeWidth="0.05"
                        markerEnd="url(#arrowhead)"
                    />
                </g>
            ))}

            {/* Observers (Camera) */}
            {observers?.map((obs, i) => (
                <g key={`o-${i}`} transform={`translate(${obs.position.x}, ${obs.position.y})`}>
                    <path d="M-0.2,-0.2 L0.2,-0.2 L0.2,0.2 L-0.2,0.2 Z" fill="#4299e1" stroke="black" strokeWidth="0.02" />
                    <text y="-0.4" fontSize="0.25" textAnchor="middle" fill="#4299e1" fontWeight="bold">CAM</text>
                    <path
                        d={`M0,0 L${1.5 * Math.sin((obs.viewDirection - obs.fieldOfView / 2) * Math.PI / 180)},${-1.5 * Math.cos((obs.viewDirection - obs.fieldOfView / 2) * Math.PI / 180)}`}
                        stroke="#4299e1"
                        strokeWidth="0.03"
                        strokeDasharray="0.1,0.1"
                    />
                    <path
                        d={`M0,0 L${1.5 * Math.sin((obs.viewDirection + obs.fieldOfView / 2) * Math.PI / 180)},${-1.5 * Math.cos((obs.viewDirection + obs.fieldOfView / 2) * Math.PI / 180)}`}
                        stroke="#4299e1"
                        strokeWidth="0.03"
                        strokeDasharray="0.1,0.1"
                    />
                </g>
            ))}

            <defs>
                <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                    <polygon points="0 0, 6 2, 0 4" fill="#2d3748" />
                </marker>
            </defs>
        </svg>
    );
}
