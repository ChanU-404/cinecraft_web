import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, X, Check, ChevronRight } from 'lucide-react';

interface SetupData {
    startDate: string;
    callTime: string;
    lunchDuration: number;
    maxHours: number;
    days: number;
    location: string;
}

interface ProductionSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (data: SetupData) => void;
}

export function ProductionSetupModal({ isOpen, onClose, onComplete }: ProductionSetupModalProps) {
    const [step, setStep] = useState(1);
    const [data, setData] = useState<SetupData>({
        startDate: new Date().toISOString().split('T')[0],
        callTime: "07:00",
        lunchDuration: 60,
        maxHours: 12,
        days: 1,
        location: ""
    });

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
        else onComplete(data);
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#1e293b] border border-[#334155] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="bg-[#0f172a] p-4 border-b border-[#334155] flex justify-between items-center">
                    <h2 className="font-bold text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[#ff365c]" />
                        스케줄 초기 설정 (Schedule Setup)
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-[#334155] rounded-full text-gray-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ x: 10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -10, opacity: 0 }}
                                className="space-y-6"
                            >
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
                                        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">집합 시간 (Call Time)</label>
                                        <input
                                            type="time"
                                            value={data.callTime}
                                            onChange={(e) => setData({ ...data, callTime: e.target.value })}
                                            className="w-full bg-[#0b0f17] border border-[#334155] rounded-lg p-3 text-white focus:border-[#ff365c] focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">메인 로케이션 (Main Location)</label>
                                    <input
                                        type="text"
                                        placeholder="예: 서울, 부산 스튜디오 등"
                                        value={data.location}
                                        onChange={(e) => setData({ ...data, location: e.target.value })}
                                        className="w-full bg-[#0b0f17] border border-[#334155] rounded-lg p-3 text-white focus:border-[#ff365c] focus:outline-none placeholder:text-gray-600"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">총 촬영 회차 (Shooting Days)</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            step="1"
                                            value={data.days}
                                            onChange={(e) => setData({ ...data, days: parseInt(e.target.value) })}
                                            className="flex-1 accent-[#ff365c]"
                                        />
                                        <span className="font-mono text-xl font-bold w-16 text-right text-white">{data.days}일</span>
                                    </div>
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
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">일일 최대 촬영 시간 (Max Hours)</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="8"
                                            max="16"
                                            step="0.5"
                                            value={data.maxHours}
                                            onChange={(e) => setData({ ...data, maxHours: parseFloat(e.target.value) })}
                                            className="flex-1 accent-[#ff365c]"
                                        />
                                        <span className="font-mono text-xl font-bold w-16 text-right text-white">{data.maxHours}h</span>
                                    </div>
                                    <p className="text-xs text-gray-500">일반적인 촬영은 12시간 (12+1) 기준입니다.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">점심 식사 시간 (Lunch Time)</label>
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
                            </motion.div>
                        )}
                        {step === 3 && (
                            <motion.div
                                key="step3"
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
                                        <span>일정:</span> <span className="text-white">{data.startDate} ({data.days}일간)</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>집합:</span> <span className="text-white">{data.callTime} @ {data.location || '미정'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>제한:</span> <span className="text-white">일 {data.maxHours}시간</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-4 bg-[#0f172a] border-t border-[#334155] flex justify-between">
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
                        {step === 3 ? '스케줄 생성 (Generate)' : '다음'}
                        {step < 3 && <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
