import React, { useRef } from 'react';
import { ShootingScheduleData } from '@/types/production';
import { Download, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ShootingScheduleViewProps {
    data: ShootingScheduleData;
    onUpdate?: (newData: ShootingScheduleData) => void;
}

export function ShootingScheduleView({ data, onUpdate }: ShootingScheduleViewProps) {
    const printRef = useRef<HTMLDivElement>(null);

    const handleUpdateScene = (dayIndex: number, sceneIndex: number, field: keyof any, value: string) => {
        if (!onUpdate) return;
        const newData = { ...data };
        newData.days[dayIndex].scenes[sceneIndex] = {
            ...newData.days[dayIndex].scenes[sceneIndex],
            [field]: field === 'castIds' ? value.split(',').map(s => s.trim()) : value
        };
        onUpdate(newData);
    };

    const handleExport = async () => {
        if (!printRef.current) return;

        try {
            // Using explicit cast to match html2canvas expected options while including our custom 'scale' which is valid but sometimes misses types
            const options: any = {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                ignoreElements: (element: Element) => element.classList.contains('no-print')
            };

            const canvas = await html2canvas(printRef.current, options);
            const imgData = canvas.toDataURL('image/png');

            // Landscape PDF for Schedule tables
            const pdf = new jsPDF('l', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`ShootingSchedule.pdf`);
        } catch (err) {
            console.error("Export failed:", err);
            alert("PDF Export failed. Please try again or check console.");
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#1e293b] overflow-hidden">
            {/* Toolbar */}
            <div className="bg-[#020617] border-b border-[#334155] p-4 flex justify-end">
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-[#ff365c] hover:bg-[#ff1f4b] text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#ff365c]/20 transition-all"
                >
                    <Download className="w-4 h-4" /> Export PDF (Landscape)
                </button>
            </div>

            {/* Scrollable Preview Area */}
            <div className="flex-1 overflow-auto p-8 bg-[#52525b] flex justify-center">
                {/* A4 Landscape Paper Container */}
                <div
                    ref={printRef}
                    className="w-[297mm] min-h-[210mm] bg-[#ffffff] text-[#000000] p-[10mm] shadow-2xl origin-top transform scale-75 lg:scale-90"
                    style={{
                        fontFamily: '"Malgun Gothic", "Apple SD Gothic Neo", sans-serif',
                        backgroundColor: '#ffffff', // Explicit inline style
                        color: '#000000'
                    }}
                >
                    <h1 className="text-2xl font-black text-center mb-6 border-b-4 border-[#000000] pb-2">
                        일일 촬영 계획표 (Shooting Schedule)
                    </h1>

                    {data.days.map((day, dIdx) => (
                        <div key={dIdx} className="mb-8">
                            {/* Day Header */}
                            <div className="bg-[#1f2937] text-[#ffffff] p-2 flex justify-between items-center text-sm font-bold border border-[#000000]">
                                <div className="flex items-center gap-4">
                                    <span className="bg-[#ff365c] px-2 py-0.5 rounded text-[#ffffff]">DAY {day.dayNumber}</span>
                                    <span>{day.date}</span>
                                    <span className="text-[#d1d5db] font-normal">| {day.location}</span>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-normal">
                                    <span>Sunrise: {day.sunrise}</span>
                                    <span>Sunset: {day.sunset}</span>
                                </div>
                            </div>

                            {/* Table */}
                            <table className="w-full text-xs border-collapse border border-[#000000] table-fixed">
                                <thead className="bg-[#f3f4f6] font-bold text-center">
                                    <tr>
                                        <th className="border border-[#000000] p-1 w-[12%]">Time</th>
                                        <th className="border border-[#000000] p-1 w-[8%]">S#</th>
                                        <th className="border border-[#000000] p-1 w-[15%]">장소 (Loc)</th>
                                        <th className="border border-[#000000] p-1 w-[8%]">D/N</th>
                                        <th className="border border-[#000000] p-1 w-[35%]">내용 (Description)</th>
                                        <th className="border border-[#000000] p-1 w-[12%]">등장인물 (Cast)</th>
                                        <th className="border border-[#000000] p-1 w-[10%]">소품 (Props)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {day.scenes.map((scene, sIdx) => (
                                        <tr key={scene.id} className="hover:bg-[#f9fafb]">
                                            <td className="border border-[#000000] p-0 break-words align-top">
                                                <input
                                                    className="w-full p-2 text-center bg-transparent outline-none focus:bg-[#eff6ff] text-xs"
                                                    value={scene.time}
                                                    onChange={e => handleUpdateScene(dIdx, sIdx, 'time', e.target.value)}
                                                />
                                            </td>
                                            <td className="border border-[#000000] p-0 text-center font-bold bg-[#ffffff] align-top">
                                                <input
                                                    className="w-full p-2 text-center bg-transparent outline-none font-bold text-xs"
                                                    value={scene.sceneId}
                                                    onChange={e => handleUpdateScene(dIdx, sIdx, 'sceneId', e.target.value)}
                                                />
                                            </td>
                                            <td className="border border-[#000000] p-0 align-top">
                                                <textarea
                                                    className="w-full h-full min-h-[40px] p-2 bg-transparent outline-none resize-none text-xs text-center"
                                                    value={scene.location}
                                                    onChange={e => handleUpdateScene(dIdx, sIdx, 'location', e.target.value)}
                                                />
                                            </td>
                                            <td className="border border-[#000000] p-0 align-top">
                                                <input
                                                    className="w-full p-2 text-center bg-transparent outline-none text-xs"
                                                    value={scene.dayNight}
                                                    onChange={e => handleUpdateScene(dIdx, sIdx, 'dayNight', e.target.value)}
                                                />
                                            </td>
                                            <td className="border border-[#000000] p-1 align-top">
                                                <div className="flex flex-col h-full">
                                                    <input
                                                        className="w-full bg-transparent outline-none font-bold mb-1 block text-xs"
                                                        value={scene.intExt}
                                                        onChange={e => handleUpdateScene(dIdx, sIdx, 'intExt', e.target.value)}
                                                    />
                                                    <textarea
                                                        className="w-full flex-1 min-h-[50px] bg-transparent outline-none text-[#4b5563] resize-none text-xs leading-tight"
                                                        value={scene.description}
                                                        onChange={e => handleUpdateScene(dIdx, sIdx, 'description', e.target.value)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="border border-[#000000] p-0 align-top">
                                                <textarea
                                                    className="w-full h-full min-h-[50px] p-1 text-center bg-transparent outline-none resize-none text-xs"
                                                    value={scene.castIds.join(', ')}
                                                    onChange={e => handleUpdateScene(dIdx, sIdx, 'castIds', e.target.value)}
                                                />
                                            </td>
                                            <td className="border border-[#000000] p-0 align-top">
                                                <textarea
                                                    className="w-full h-full min-h-[50px] p-1 text-center bg-transparent outline-none resize-none text-[#6b7280] text-xs"
                                                    value={scene.props || ''}
                                                    placeholder="-"
                                                    onChange={e => handleUpdateScene(dIdx, sIdx, 'props', e.target.value)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Footer for Day */}
                            {day.notes && (
                                <div className="border border-t-0 border-[#000000] p-2 bg-[#fefce8] text-xs italic">
                                    <strong>Note:</strong> {day.notes}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
