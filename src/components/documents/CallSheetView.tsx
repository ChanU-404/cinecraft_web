import React, { useRef } from 'react';
import { CallSheetData } from '@/types/production';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CallSheetViewProps {
    data: CallSheetData;
    onUpdate?: (newData: CallSheetData) => void;
}

export function CallSheetView({ data, onUpdate }: CallSheetViewProps) {
    const printRef = useRef<HTMLDivElement>(null);

    const handleUpdate = (field: keyof CallSheetData, value: any) => {
        if (!onUpdate) return;
        onUpdate({ ...data, [field]: value });
    };

    const handleExport = async () => {
        if (!printRef.current) return;

        try {
            const options: any = {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            };

            const canvas = await html2canvas(printRef.current, options);
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`CallSheet_Day${data.dayNumber}.pdf`);
        } catch (err) {
            console.error("Export failed:", err);
            alert("Export failed. Please check console.");
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
                    <Download className="w-4 h-4" /> Export PDF
                </button>
            </div>

            {/* Scrollable Preview Area */}
            <div className="flex-1 overflow-auto p-8 bg-[#52525b] flex justify-center">
                {/* A4 Paper Container */}
                <div
                    ref={printRef}
                    className="w-[210mm] min-h-[297mm] bg-[#ffffff] text-[#000000] p-[10mm] shadow-2xl origin-top transform scale-90 sm:scale-100"
                    style={{
                        fontFamily: 'Arial, sans-serif',
                        backgroundColor: '#ffffff',
                        color: '#000000'
                    }}
                >
                    {/* HEADER */}
                    <div className="border-4 border-[#000000] mb-4">
                        <div className="grid grid-cols-4 border-b-2 border-[#000000]">
                            <div className="p-2 border-r-2 border-[#000000] text-xs font-bold">
                                PRODUCTION COMPANY<br />
                                <span className="font-normal">CineCraft Studios</span>
                            </div>
                            <div className="col-span-2 p-2 border-r-2 border-[#000000] text-center">
                                <h1 className="text-3xl font-black uppercase tracking-tighter">{data.productionTitle}</h1>
                            </div>
                            <div className="p-2 text-xs">
                                <div>Date: <span className="font-bold">{data.date}</span></div>
                                <div>Day: <span className="font-bold text-xl">{data.dayNumber}</span> / {data.totalDays}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2">
                            <div className="p-4 border-r-2 border-[#000000]">
                                <div className="text-xs uppercase font-bold text-[#6b7280]">GENERAL CALL TIME</div>
                                <div className="text-5xl font-black text-center my-2">{data.callTime}</div>
                                <div className="text-center text-xs text-[#dc2626] font-bold uppercase">Please be on time</div>
                            </div>
                            <div className="p-2 text-xs grid grid-cols-2 gap-2">
                                <div>
                                    <span className="font-bold block">WEATHER</span>
                                    {data.weather.forecast}, H:{data.weather.tempHigh} L:{data.weather.tempLow}
                                </div>
                                <div>
                                    <span className="font-bold block">SUN MOCK</span>
                                    Rise: {data.weather.sunrise}<br />Set: {data.weather.sunset}
                                </div>
                                <div className="col-span-2 border-t border-[#9ca3af] pt-1 mt-1">
                                    <span className="font-bold block">EMERGENCY CONTACT</span>
                                    {data.emergencyContact.name}: {data.emergencyContact.phone}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* LOCATIONS */}
                    <table className="w-full border-2 border-[#000000] mb-4 text-xs">
                        <thead>
                            <tr className="bg-[#e5e7eb]">
                                <th className="border border-[#000000] p-1">BASECAMP</th>
                                <th className="border border-[#000000] p-1">LOCATION (SET)</th>
                                <th className="border border-[#000000] p-1">HOSPITAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-[#000000] p-2 text-center">{data.locations.basecamp}</td>
                                <td className="border border-[#000000] p-2 text-center font-bold">{data.locations.set}</td>
                                <td className="border border-[#000000] p-2 text-center">{data.locations.hospital}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* SCENES */}
                    <div className="mb-4">
                        <div className="bg-[#000000] text-[#ffffff] px-2 py-1 font-bold text-sm uppercase">Shooting Schedule</div>
                        <table className="w-full border-2 border-[#000000] text-xs table-fixed">
                            <thead>
                                <tr className="bg-[#e5e7eb]">
                                    <th className="border border-[#000000] p-1 w-[15%]">SCENE</th>
                                    <th className="border border-[#000000] p-1 w-[45%]">SET & DESCRIPTION</th>
                                    <th className="border border-[#000000] p-1 w-[10%]">D/N</th>
                                    <th className="border border-[#000000] p-1 w-[10%]">PAGES</th>
                                    <th className="border border-[#000000] p-1 w-[20%]">CAST</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.scenes.map((scene, idx) => (
                                    <tr key={idx}>
                                        <td className="border border-[#000000] p-1 text-center font-bold bg-[#ffffff] break-words align-top">{scene.sceneId}</td>
                                        <td className="border border-[#000000] p-1 align-top">
                                            <span className="font-bold block break-words">{scene.intExt}. {scene.location}</span>
                                            <span className="text-[#4b5563] italic break-words block mt-1">{scene.description}</span>
                                        </td>
                                        <td className="border border-[#000000] p-1 text-center align-top">{scene.dayNight}</td>
                                        <td className="border border-[#000000] p-1 text-center align-top">{scene.pages}</td>
                                        <td className="border border-[#000000] p-1 text-center break-words align-top">{scene.castIds.join(', ')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* CAST */}
                    <div className="mb-4">
                        <div className="bg-[#000000] text-[#ffffff] px-2 py-1 font-bold text-sm uppercase">Cast Call</div>
                        <table className="w-full border-2 border-[#000000] text-xs table-fixed">
                            <thead>
                                <tr className="bg-[#e5e7eb]">
                                    <th className="border border-[#000000] p-1 w-[25%]">CAST</th>
                                    <th className="border border-[#000000] p-1 w-[35%]">CHARACTER</th>
                                    <th className="border border-[#000000] p-1 w-[20%]">PICKUP</th>
                                    <th className="border border-[#000000] p-1 w-[20%]">ON SET</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.cast.map((member, idx) => (
                                    <tr key={idx}>
                                        <td className="border border-[#000000] p-1 font-bold break-words align-top">{member.name}</td>
                                        <td className="border border-[#000000] p-1 break-words align-top">{member.character}</td>
                                        <td className="border border-[#000000] p-1 text-center align-top">{member.pickupTime}</td>
                                        <td className="border border-[#000000] p-1 text-center font-bold align-top">{member.callTime}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* NOTES */}
                    <div className="border-2 border-[#000000] p-2 min-h-[100px]">
                        <div className="font-bold text-xs underline mb-1">ADVANCE SCHEDULE / NOTES</div>
                        <p className="text-xs">
                            {/* Filler text */}
                            - Please keep radios on Channel 1.<br />
                            - Lunch will be served at 13:00.<br />
                            - Quiet on set during recording.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
