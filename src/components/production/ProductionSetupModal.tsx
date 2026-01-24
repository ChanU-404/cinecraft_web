import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, X, Check, ChevronRight } from 'lucide-react';
import { DailyConfig } from '@/lib/production/types';

interface SetupData {
    startDate: string;
    endDate: string;
    defaultCallTime: string;
    defaultMaxHours: number;
    lunchDuration: number;
    dailyConfigs: DailyConfig[];
    locationMap: Record<string, string>;
}

interface ProductionSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (data: SetupData) => void;
    uniqueLocations: string[];
}

export function ProductionSetupModal({ isOpen, onClose, onComplete, uniqueLocations }: ProductionSetupModalProps) {
    const [step, setStep] = useState(1);
    const [data, setData] = useState<SetupData>(() => {
        const today = new Date().toISOString().split('T')[0];
        return {
            startDate: today,
            endDate: today,
            defaultCallTime: "07:00",
            defaultMaxHours: 12,
            lunchDuration: 60,
            dailyConfigs: [],
            locationMap: {}
        };
    });

    // Calculate dailyConfigs when dates change
    React.useEffect(() => {
        if (data.startDate && data.endDate) {
            const start = new Date(data.startDate);
            const end = new Date(data.endDate);

            if (end >= start) {
                const configs: DailyConfig[] = [];
                const current = new Date(start);

                while (current <= end) {
                    configs.push({
                        date: current.toISOString().split('T')[0],
                        callTime: data.defaultCallTime,
                        maxHours: data.defaultMaxHours
                    });
                    current.setDate(current.getDate() + 1);
                }

                setData(prev => ({ ...prev, dailyConfigs: configs }));
            }
        }
    }, [data.startDate, data.endDate, data.defaultCallTime, data.defaultMaxHours]);

    // Auto-fill location map on init
    React.useEffect(() => {
        if (uniqueLocations.length > 0) {
            const initialMap: Record<string, string> = {};
            uniqueLocations.forEach(loc => initialMap[loc] = "");
            setData(prev => ({ ...prev, locationMap: initialMap }));
        }
    }, [uniqueLocations]);

    const handleNext = () => {
        if (step < 4) setStep(step + 1);
        else onComplete(data);
    };

    const updateDailyConfig = (index: number, field: keyof DailyConfig, value: string | number) => {
        const newConfigs = [...data.dailyConfigs];
        newConfigs[index] = { ...newConfigs[index], [field]: value };
        setData({ ...data, dailyConfigs: newConfigs });
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#1e293b] border border-[#334155] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="bg-[#0f172a] p-4 border-b border-[#334155] flex justify-between items-center shrink-0">
                    <h2 className="font-bold text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[#ff365c]" />
                        스케줄 초기 설정 (Schedule Setup) - Step {step}/4
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-[#334155] rounded-full text-gray-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ x: 10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -10, opacity: 0 }}
                                className="space-y-6"
                            >
                                <h3 className="text-lg font-bold text-emerald-400 mb-4">날짜 범위 및 기본 설정</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">촬영 시작일 (Start Date)</label>
                                        <input
                                            type="date"
                                            value={data.startDate}
                                            onChange={(e) => setData({ ...data, startDate: e.target.value })}
                                            className="w-full bg-[#0b0f17] border border-[#334155] rounded-lg p-3 text-white focus:border-[#ff365c] focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">촬영 종료일 (End Date)</label>
                                        <input
                                            type="date"
                                            value={data.endDate}
                                            onChange={(e) => setData({ ...data, endDate: e.target.value })}
                                            min={data.startDate}
                                            className="w-full bg-[#0b0f17] border border-[#334155] rounded-lg p-3 text-white focus:border-[#ff365c] focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">기본 집합시간 (Default Call Time)</label>
                                        <input
                                            type="time"
                                            value={data.defaultCallTime}
                                            onChange={(e) => setData({ ...data, defaultCallTime: e.target.value })}
                                            className="w-full bg-[#0b0f17] border border-[#334155] rounded-lg p-3 text-white focus:border-[#ff365c] focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">기본 최대시간 (Default Max Hours)</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="range"
                                                min="8"
                                                max="16"
                                                step="0.5"
                                                value={data.defaultMaxHours}
                                                onChange={(e) => setData({ ...data, defaultMaxHours: parseFloat(e.target.value) })}
                                                className="flex-1 accent-[#ff365c]"
                                            />
                                            <span className="font-mono text-lg font-bold w-12 text-white">{data.defaultMaxHours}h</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">점심 식사 시간 (Lunch Duration)</label>
                                    <div className="flex gap-3">
                                        {[30, 45, 60].map(duration => (
                                            <button
                                                key={duration}
                                                onClick={() => setData({ ...data, lunchDuration: duration })}
                                                className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all
                                                    ${data.lunchDuration === duration
                                                        ? 'bg-[#ff365c] border-[#ff365c] text-white'
                                                        : 'bg-[#0b0f17] border-[#334155] text-gray-400 hover:border-gray-400'
                                                    }`}
                                            >
                                                {duration}분
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-[#0b0f17] p-4 rounded-lg border border-[#334155]">
                                    <p className="text-sm text-gray-400">
                                        총 <span className="text-emerald-400 font-bold">{data.dailyConfigs.length}일</span> 촬영 예정
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ x: 10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -10, opacity: 0 }}
                                className="space-y-6"
                            >
                                <h3 className="text-lg font-bold text-emerald-400 mb-4">일별 세부 설정 (Daily Details)</h3>
                                <p className="text-xs text-gray-500 mb-4">각 촬영일의 집합시간과 최대 촬영시간을 개별적으로 조정할 수 있습니다.</p>

                                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {data.dailyConfigs.map((config, index) => (
                                        <div key={index} className="bg-[#0b0f17] p-4 rounded-lg border border-[#334155] space-y-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-bold text-white">Day {index + 1}</span>
                                                <span className="text-sm text-gray-400">{config.date}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-gray-400">집합시간 (Call Time)</label>
                                                    <input
                                                        type="time"
                                                        value={config.callTime}
                                                        onChange={(e) => updateDailyConfig(index, 'callTime', e.target.value)}
                                                        className="w-full bg-[#1e293b] border border-[#334155] rounded p-2 text-sm text-white focus:border-[#ff365c] focus:outline-none"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-gray-400">최대시간 (Max Hours)</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="range"
                                                            min="8"
                                                            max="16"
                                                            step="0.5"
                                                            value={config.maxHours}
                                                            onChange={(e) => updateDailyConfig(index, 'maxHours', parseFloat(e.target.value))}
                                                            className="flex-1 accent-[#ff365c]"
                                                        />
                                                        <span className="font-mono text-sm font-bold w-10 text-white">{config.maxHours}h</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ x: 10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -10, opacity: 0 }}
                                className="space-y-6"
                            >
                                <h3 className="text-lg font-bold text-emerald-400 mb-4">로케이션 매핑 (Real World Locations)</h3>
                                <p className="text-xs text-gray-500 mb-4">시나리오상의 장소를 실제 촬영지 주소나 이름으로 연결해주세요.</p>

                                <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {uniqueLocations.map(loc => (
                                        <div key={loc} className="space-y-1">
                                            <label className="text-xs font-bold text-gray-400">{loc}</label>
                                            <input
                                                type="text"
                                                placeholder="실제 촬영 장소 입력..."
                                                value={data.locationMap[loc] || ""}
                                                onChange={(e) => setData({
                                                    ...data,
                                                    locationMap: { ...data.locationMap, [loc]: e.target.value }
                                                })}
                                                className="w-full bg-[#0b0f17] border border-[#334155] rounded-lg p-2 text-sm text-white focus:border-[#ff365c] focus:outline-none"
                                            />
                                        </div>
                                    ))}
                                    {uniqueLocations.length === 0 && (
                                        <p className="text-sm text-gray-500 text-center">감지된 로케이션이 없습니다.</p>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ x: 10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -10, opacity: 0 }}
                                className="text-center space-y-6 py-4"
                            >
                                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                                    <Check className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">준비 완료</h3>
                                    <p className="text-gray-400 text-sm">
                                        설정하신 정보를 바탕으로 스케줄 초안을 생성합니다.
                                    </p>
                                </div>
                                <div className="text-xs bg-[#0b0f17] p-4 rounded-xl text-left space-y-2 border border-[#334155] text-gray-400 font-mono">
                                    <div className="flex justify-between">
                                        <span>일정:</span> <span className="text-white">{data.startDate} ~ {data.endDate} ({data.dailyConfigs.length}일간)</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>기본 집합:</span> <span className="text-white">{data.defaultCallTime}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>장소:</span> <span className="text-white">{Object.values(data.locationMap).filter(Boolean).length}곳 설정됨</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-4 bg-[#0f172a] border-t border-[#334155] flex justify-between shrink-0">
                    <button
                        onClick={step === 1 ? onClose : () => setStep(step - 1)}
                        className="text-gray-400 hover:text-white text-sm font-bold px-4 py-2"
                    >
                        {step === 1 ? '취소' : '이전'}
                    </button>
                    <button
                        onClick={handleNext}
                        className="bg-[#ff365c] hover:bg-[#ff1f4b] text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                    >
                        {step === 4 ? '스케줄 생성 (Generate)' : '다음'}
                        {step < 4 && <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
