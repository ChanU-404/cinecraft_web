import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Rocket } from 'lucide-react';

interface UpgradeIntentModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentDraftUsage: number;
}

export default function UpgradeIntentModal({ isOpen, onClose, currentDraftUsage }: UpgradeIntentModalProps) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        email: '',
        roleCategory: '감독 / 영화 제작자',
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
            alert("대기 명단 등록에 실패했습니다.");
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
                        <h2 className="text-xl font-bold text-white mb-1">창의력의 한계를 넓히세요</h2>
                        <p className="text-sm text-[#94a3b8]">프로 플랜으로 업그레이드하고 모든 제한을 해제하세요.</p>
                    </div>

                    <div className="p-6">
                        {step === 1 && (
                            <>
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="p-4 bg-[#1e293b]/50 rounded-xl border border-[#334155] opacity-70">
                                        <h3 className="text-sm font-bold text-[#94a3b8] mb-2">현재 플랜 (무료)</h3>
                                        <div className="text-2xl font-bold text-white mb-1">40 <span className="text-xs font-normal text-[#64748b]">이미지/월</span></div>
                                    </div>
                                    <div className="p-4 bg-gradient-to-br from-[#1e293b] to-[#1e1b4b] rounded-xl border border-[#6366f1] relative">
                                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-[#6366f1] text-white text-[10px] font-bold rounded-full">추천</div>
                                        <h3 className="text-sm font-bold text-[#6366f1] mb-2">프로 플랜</h3>
                                        <div className="text-2xl font-bold text-white mb-1">400 <span className="text-xs font-normal text-[#a5b4fc]">이미지/월</span></div>
                                    </div>
                                </div>

                                <div className="text-center mb-6">
                                    <div className="text-3xl font-bold text-white">₩9,900 <span className="text-sm font-normal text-[#94a3b8]">/ 월</span></div>
                                    <p className="text-xs text-[#64748b] mt-2">현재 베타 버전입니다. 결제 시스템이 곧 도입될 예정입니다.</p>
                                </div>

                                <button
                                    onClick={() => setStep(2)}
                                    className="w-full py-3 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Rocket size={18} />
                                    우선 대기 명단 가입하기
                                </button>
                                <div className="mt-4 text-center">
                                    <button onClick={onClose} className="text-xs text-[#64748b] hover:text-white">아니요, 무료 버전을 계속 사용하겠습니다</button>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <div className="space-y-4">
                                <p className="text-sm text-[#cbd5e1] mb-4">
                                    프로 플랜은 순차적으로 오픈하고 있습니다. 우선 승인을 위해 간단한 정보를 입력해 주세요.
                                </p>
                                <input
                                    type="email"
                                    placeholder="업무용 또는 개인 이메일"
                                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-3 text-white text-sm focus:border-[#6366f1] outline-none"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                                <select
                                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-3 text-white text-sm outline-none"
                                    value={formData.roleCategory}
                                    onChange={e => setFormData({ ...formData, roleCategory: e.target.value })}
                                >
                                    <option>감독 / 영화 제작자</option>
                                    <option>작가</option>
                                    <option>학생</option>
                                    <option>기타</option>
                                </select>
                                <textarea
                                    placeholder="CineCraft를 어떻게 활용하실 계획인가요?"
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
                                    <span className="text-xs text-[#94a3b8]">지금 바로 ₩9,900에 결제할 의사가 있습니다.</span>
                                </label>

                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !formData.email}
                                    className="w-full py-3 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 text-white font-bold rounded-xl transition-all mt-2"
                                >
                                    {isSubmitting ? '제출 중...' : '대기 명단 등록 완료'}
                                </button>
                                <button onClick={() => setStep(1)} className="w-full text-center text-xs text-[#64748b] mt-2">뒤로</button>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">명단에 등록되었습니다!</h3>
                                <p className="text-sm text-[#94a3b8] mb-6">{formData.email} 주소로 프로 플랜 오픈 시 즉시 안내해 드리겠습니다.</p>
                                <button
                                    onClick={onClose}
                                    className="w-full py-2 bg-[#1e293b] hover:bg-[#334155] text-white font-medium rounded-lg"
                                >
                                    워크스페이스로 돌아가기
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
