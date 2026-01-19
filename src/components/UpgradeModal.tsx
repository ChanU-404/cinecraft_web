import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import React from "react";

interface UpgradeModalProps {
    onUiClose: () => void;
    onUpgrade: () => void;
    currentTier: 'FREE' | 'GUEST';
}

export function UpgradeModal({ onUiClose, onUpgrade, currentTier }: UpgradeModalProps) {
    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-4xl bg-[#0b0f17] border border-[#1f2937] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row"
            >
                <button onClick={onUiClose} className="absolute top-4 right-4 text-[#64748b] hover:text-white z-20"><X /></button>

                {/* Free Tier Column */}
                <div className="flex-1 p-8 border-r border-[#1f2937] flex flex-col opacity-60">
                    <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">Free Starter</h3>
                    <div className="text-3xl font-black text-white mb-6">₩0 <span className="text-sm font-normal text-[#94a3b8]">/ month</span></div>

                    <ul className="space-y-4 text-sm text-[#94a3b8] flex-1">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Read-Only Analysis</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> 20 Draft Images / mo</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> 1 Final Render / mo</li>
                        <li className="flex items-center gap-2 decoration-slice line-through opacity-50"><X className="w-4 h-4 text-red-500" /> PDF Export & Save</li>
                    </ul>
                </div>

                {/* Pro Tier Column (Highlighted) */}
                <div className="flex-1 p-8 bg-[#1e293b]/30 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 bg-[#ff365c] text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest">Recommended</div>

                    <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-widest flex items-center gap-2">
                        Pro Director <span className="w-2 h-2 bg-[#ff365c] rounded-full animate-pulse" />
                    </h3>
                    <div className="text-3xl font-black text-white mb-6">₩9,900 <span className="text-sm font-normal text-[#94a3b8]">/ month</span></div>

                    <ul className="space-y-4 text-sm text-white flex-1 font-medium">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#ff365c]" /> <strong>Unlimited</strong> Projects & Saves</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#ff365c]" /> <strong>600</strong> Draft Quota</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#ff365c]" /> <strong>40</strong> Final Renders</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#ff365c]" /> PDF Export & Sharing</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#ff365c]" /> Priority Support</li>
                    </ul>

                    <button
                        onClick={onUpgrade}
                        className="w-full mt-8 bg-[#ff365c] hover:bg-[#ff1f4b] text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-[#ff365c]/20 transition-transform hover:scale-[1.02]"
                    >
                        Upgrade to Pro
                    </button>
                </div>

            </motion.div>
        </div>
    );
}
