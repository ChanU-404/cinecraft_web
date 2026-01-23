import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Check, FileText, Loader2, Calendar, Users, AlertCircle } from 'lucide-react';
import { Scene } from '@/context/ScreenplayContext';

interface OperationalInterviewProps {
    onComplete: (data: any) => void;
    onClose: () => void;
    scenes?: Scene[];
}

type Question = {
    id: string;
    text: string;
    category: 'basic' | 'scene_logic' | 'location' | 'cast' | 'priority';
    type: 'text' | 'number' | 'date' | 'select' | 'checkbox';
    options?: string[];
};

// 1st AD System Prompt Question Set
const QUESTIONS: Question[] = [
    // A. Basic Conditions
    { id: 'call_time', text: "1. 이 촬영일의 예정된 집합 시간(Call Time)은 언제인가요? (예: 07:00)", category: 'basic', type: 'text' },
    { id: 'wrap_time', text: "2. 예상되는 종료 시간(Wrap Time) 또는 최대 촬영 시간은 어떻게 되나요? (예: 12시간)", category: 'basic', type: 'text' },
    { id: 'meal_break', text: "3. 정해진 식사 시간이 있나요? (예: 12:00-13:00 또는 '집합 후 6시간 뒤')", category: 'basic', type: 'text' },

    // B. Scene Logic
    {
        id: 'avg_duration',
        text: "4. 오늘 씬당 평균 예상 촬영 소요 시간은 어떻게 되나요?",
        category: 'scene_logic',
        type: 'select',
        options: ["30분 미만", "30-60분", "1-2시간", "2시간 이상"]
    },
    {
        id: 'mandatory_scenes',
        text: "5. 오늘 반드시 촬영해야 하는 필수 씬이 있다면 알려주세요. (씬 번호 또는 '전체')",
        category: 'scene_logic',
        type: 'text'
    },

    // C. Locations
    { id: 'location_count', text: "6. 오늘 사용하는 로케이션(장소)은 총 몇 곳인가요?", category: 'location', type: 'number' },
    { id: 'travel_time', text: "7. 로케이션 간 이동 시간이 있나요? 있다면 몇 분 정도 소요되나요?", category: 'location', type: 'text' },

    // D. Cast & Resources
    { id: 'cast_limits', text: "8. 특정 시간 제한이 있는 출연진이나 스태프가 있나요? (예: '배우 A 오후 2시까지')", category: 'cast', type: 'text' },
    { id: 'day_night_deps', text: "9. 낮/밤 시간대에 반드시 촬영해야 하는 씬이 있나요?", category: 'cast', type: 'text' },

    // E. Priority
    { id: 'first_scene', text: "10. 가장 먼저 촬영하고 싶은 씬은 무엇인가요? (씬 번호)", category: 'priority', type: 'text' },
    { id: 'last_scene', text: "11. 마지막으로 미루거나 상황에 따라 생략 가능한 씬이 있나요?", category: 'priority', type: 'text' }
];

export function OperationalInterview({ onComplete, onClose, scenes = [] }: OperationalInterviewProps) {
    const [messages, setMessages] = useState<{ role: 'ai' | 'user', content: string }[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial Question with Context
    useEffect(() => {
        const timer = setTimeout(() => {
            const contextMsg = scenes.length > 0
                ? `현재 프로젝트에는 총 ${scenes.length}개의 씬이 있습니다. 각 씬의 내용과 로케이션 정보를 바탕으로 최적의 스케줄을 제안해 드리겠습니다.`
                : "";

            setMessages([
                { role: 'ai', content: `안녕하세요, 조감독(1st AD) AI입니다.\n입력해주신 정보를 바탕으로 현실적인 촬영 일일 촬영표(Daily Schedule)와 콜시트(Call Sheet)를 생성하겠습니다.\n\n${contextMsg}\n\n1일차 촬영 계획을 세워보겠습니다.` }
            ]);

            setTimeout(() => askQuestion(0, true), 1000);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    // Auto-scroll
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const askQuestion = (index: number, skipDelay = false) => {
        if (index < QUESTIONS.length) {
            if (!skipDelay) setIsTyping(true);
            setTimeout(() => {
                setMessages(prev => [...prev, { role: 'ai', content: QUESTIONS[index].text }]);
                setIsTyping(false);
            }, skipDelay ? 0 : 800);
        } else {
            finishInterview();
        }
    };

    const handleSend = (textOffset?: string) => {
        const valueToSend = textOffset || input.trim();
        if (!valueToSend) return;

        const questionId = QUESTIONS[currentQuestionIndex].id;

        // Store Answer
        setAnswers(prev => ({ ...prev, [questionId]: valueToSend }));

        // Update UI
        setMessages(prev => [...prev, { role: 'user', content: valueToSend }]);
        setInput("");

        // Next Question
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        askQuestion(nextIndex);
    };

    const finishInterview = () => {
        setIsTyping(true);
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'ai', content: "확인되었습니다. 1일차 촬영 스케줄과 콜시트를 생성 중입니다..." }]);
            setIsTyping(false);
            // Compile results
            setTimeout(() => {
                onComplete(answers);
            }, 1500);
        }, 800);
    };

    const currentQ = QUESTIONS[currentQuestionIndex];

    return (
        <div className="flex flex-col h-full bg-[#0f172a] rounded-xl overflow-hidden border border-[#334155]">
            {/* Header */}
            <div className="p-4 border-b border-[#334155] bg-[#020617] flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-600 p-2 rounded-lg">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-base">AI 조감독 (1st AD)</h3>
                        <p className="text-sm text-[#94a3b8]">촬영 스케줄링 모드</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-white transition-colors"
                >
                    <span className="text-xs font-bold uppercase tracking-wider">취소</span>
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#0b0f17]">
                {messages.map((msg, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`
                            max-w-[80%] p-5 rounded-2xl text-base leading-relaxed whitespace-pre-wrap shadow-lg
                            ${msg.role === 'user'
                                ? 'bg-emerald-600 text-white rounded-tr-none'
                                : 'bg-[#1e293b] text-[#e2e8f0] rounded-tl-none border border-[#334155]'}
                        `}>
                            {msg.content}
                        </div>
                    </motion.div>
                ))}

                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                    >
                        <div className="bg-[#1e293b] px-4 py-3 rounded-xl rounded-tl-none border border-[#334155] flex gap-1.5 items-center">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </motion.div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="p-5 border-t border-[#334155] bg-[#020617]">
                {currentQ?.options ? (
                    <div className="flex flex-wrap gap-2">
                        {currentQ.options.map(opt => (
                            <button
                                key={opt}
                                onClick={() => handleSend(opt)}
                                className="bg-[#1e293b] hover:bg-emerald-600 border border-[#334155] hover:border-emerald-500 text-white px-5 py-3 rounded-full text-sm font-bold transition-all shadow-md active:scale-95"
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={currentQuestionIndex < QUESTIONS.length ? "답변을 입력하세요..." : "인터뷰 완료"}
                            disabled={currentQuestionIndex >= QUESTIONS.length}
                            className="flex-1 bg-[#1e293b] border border-[#334155] rounded-l-xl px-5 py-4 text-white text-base focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-500"
                            autoFocus
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || currentQuestionIndex >= QUESTIONS.length}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 rounded-r-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                )}
                <div className="mt-3 text-xs text-center text-[#64748b]">
                    촬영 현장 상황(Call Time, 장소 이동 등)을 정확히 입력할수록 더 정교한 스케줄이 생성됩니다.
                </div>
            </div>
        </div>
    );
}
