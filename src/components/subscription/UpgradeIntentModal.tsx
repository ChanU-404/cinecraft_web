import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Lock, Rocket } from 'lucide-react';

interface UpgradeIntentModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentDraftUsage: number;
}

export default function UpgradeIntentModal({ isOpen, onClose, currentDraftUsage }: UpgradeIntentModalProps) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        email: '',
        roleCategory: 'Director',
        useCaseText: '',
        willingness: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            setStep(3); // Success
        } catch (e) {
            alert("Failed to join waitlist.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#0f172a] border border-[#334155] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="bg-[#1e293b] p-6 text-center border-b border-[#334155]">
                        <h2 className="text-xl font-bold text-white mb-1">Unlock Limitless Creativity</h2>
                        <p className="text-sm text-[#94a3b8]">Upgrade to Pro to remove limits.</p>
                    </div>

                    <div className="p-6">
                        {step === 1 && (
                            <>
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="p-4 bg-[#1e293b]/50 rounded-xl border border-[#334155] opacity-70">
                                        <h3 className="text-sm font-bold text-[#94a3b8] mb-2">CURRENT (FREE)</h3>
                                        <div className="text-2xl font-bold text-white mb-1">40 <span className="text-xs font-normal text-[#64748b]">Images/mo</span></div>
                                    </div>
                                    <div className="p-4 bg-gradient-to-br from-[#1e293b] to-[#1e1b4b] rounded-xl border border-[#6366f1] relative">
                                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-[#6366f1] text-white text-[10px] font-bold rounded-full">RECOMMENDED</div>
                                        <h3 className="text-sm font-bold text-[#6366f1] mb-2">PRO PLAN</h3>
                                        <div className="text-2xl font-bold text-white mb-1">400 <span className="text-xs font-normal text-[#a5b4fc]">Images/mo</span></div>
                                    </div>
                                </div>

                                <div className="text-center mb-6">
                                    <div className="text-3xl font-bold text-white">₩9,900 <span className="text-sm font-normal text-[#94a3b8]">/ month</span></div>
                                    <p className="text-xs text-[#64748b] mt-2">Currently in Beta. Payment integration coming soon.</p>
                                </div>

                                <button
                                    onClick={() => setStep(2)}
                                    className="w-full py-3 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Rocket size={18} />
                                    Join Priority Acess List
                                </button>
                                <div className="mt-4 text-center">
                                    <button onClick={onClose} className="text-xs text-[#64748b] hover:text-white">No thanks, stick to free limit</button>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <div className="space-y-4">
                                <p className="text-sm text-[#cbd5e1] mb-4">
                                    We are rolling out Pro access in batches. Tell us a bit about yourself to get priority approval.
                                </p>
                                <input
                                    type="email"
                                    placeholder="Your Work/Personal Email"
                                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-3 text-white text-sm focus:border-[#6366f1] outline-none"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                                <select
                                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-3 text-white text-sm outline-none"
                                    value={formData.roleCategory}
                                    onChange={e => setFormData({ ...formData, roleCategory: e.target.value })}
                                >
                                    <option>Director / Filmmaker</option>
                                    <option>Writer</option>
                                    <option>Student</option>
                                    <option>Other</option>
                                </select>
                                <textarea
                                    placeholder="How do you plan to use CineCraft?"
                                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-3 text-white text-sm outline-none h-24 resize-none"
                                    value={formData.useCaseText}
                                    onChange={e => setFormData({ ...formData, useCaseText: e.target.value })}
                                />
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded bg-[#1e293b] border-[#334155]"
                                        checked={formData.willingness}
                                        onChange={e => setFormData({ ...formData, willingness: e.target.checked })}
                                    />
                                    <span className="text-xs text-[#94a3b8]">I would pay ₩9,900 right now if available.</span>
                                </label>

                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !formData.email}
                                    className="w-full py-3 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 text-white font-bold rounded-xl transition-all mt-2"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Complete Waitlist Registration'}
                                </button>
                                <button onClick={() => setStep(1)} className="w-full text-center text-xs text-[#64748b] mt-2">Back</button>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">You're on the list!</h3>
                                <p className="text-sm text-[#94a3b8] mb-6">We will notify you at {formData.email} as soon as Pro access opens.</p>
                                <button
                                    onClick={onClose}
                                    className="w-full py-2 bg-[#1e293b] hover:bg-[#334155] text-white font-medium rounded-lg"
                                >
                                    Back to Workspace
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
