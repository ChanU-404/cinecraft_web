import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, X, Check, ChevronRight } from 'lucide-react';

interface SetupData {
    startDate: string;
    callTime: string;
    lunchDuration: number;
    maxHours: number;
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
        maxHours: 12
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
                        Initial Setup
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
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Shoot Start Date</label>
                                    <input
                                        type="date"
                                        value={data.startDate}
                                        onChange={(e) => setData({ ...data, startDate: e.target.value })}
                                        className="w-full bg-[#0b0f17] border border-[#334155] rounded-lg p-3 text-white focus:border-[#ff365c] focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Crew Call Time</label>
                                    <input
                                        type="time"
                                        value={data.callTime}
                                        onChange={(e) => setData({ ...data, callTime: e.target.value })}
                                        className="w-full bg-[#0b0f17] border border-[#334155] rounded-lg p-3 text-white focus:border-[#ff365c] focus:outline-none"
                                    />
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
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Working Hours Limit</label>
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
                                        <span className="font-mono text-xl font-bold w-16 text-right">{data.maxHours}h</span>
                                    </div>
                                    <p className="text-xs text-gray-500">Standard tends to be 12h (12+1).</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Lunch Duration (min)</label>
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
                                                {duration}m
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
                                    <h3 className="text-xl font-bold text-white mb-2">Ready to Generate</h3>
                                    <p className="text-gray-400 text-sm">
                                        AI will now arrange your scenes based on these settings.
                                    </p>
                                </div>
                                <div className="text-xs bg-[#0b0f17] p-4 rounded-xl text-left space-y-2 border border-[#334155] text-gray-400 font-mono">
                                    <div className="flex justify-between">
                                        <span>Start:</span> <span className="text-white">{data.startDate} @ {data.callTime}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Limit:</span> <span className="text-white">{data.maxHours}h / day</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Lunch:</span> <span className="text-white">{data.lunchDuration}m</span>
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
                        {step === 1 ? 'Cancel' : 'Back'}
                    </button>
                    <button
                        onClick={handleNext}
                        className="bg-[#ff365c] hover:bg-[#ff1f4b] text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                    >
                        {step === 3 ? 'Generate Schedule' : 'Next'}
                        {step < 3 && <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
