import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Check, FileText, Loader2, Calendar, Users, AlertCircle } from 'lucide-react';

interface OperationalInterviewProps {
    onComplete: (data: any) => void;
    onClose: () => void;
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
    { id: 'call_time', text: "1. What is the planned CALL TIME for this shooting day? (e.g., 07:00)", category: 'basic', type: 'text' },
    { id: 'wrap_time', text: "2. What is the expected WRAP TIME or maximum working hours? (e.g., 12 hours)", category: 'basic', type: 'text' },
    { id: 'meal_break', text: "3. Is there a fixed MEAL BREAK time? (e.g. 12:00-13:00 or '6 hours after call')", category: 'basic', type: 'text' },

    // B. Scene Logic (Simplified for Chat - Asking about general pacing)
    {
        id: 'avg_duration',
        text: "4. What is the average estimated shooting duration per scene today?",
        category: 'scene_logic',
        type: 'select',
        options: ["Under 30 min", "30-60 min", "1-2 hours", "2+ hours"]
    },
    {
        id: 'mandatory_scenes',
        text: "5. Are there any MANDATORY scenes that must be shot today? (List Scene IDs or 'All')",
        category: 'scene_logic',
        type: 'text'
    },

    // C. Locations
    { id: 'location_count', text: "7. How many unique locations are being used today?", category: 'location', type: 'number' },
    { id: 'travel_time', text: "8. Is there TRAVEL TIME between locations? (If yes, specify minutes)", category: 'location', type: 'text' },

    // D. Cast & Resources
    { id: 'cast_limits', text: "9. Are there specific CAST MEMBERS with limited availability? (e.g. 'Actor A until 2pm')", category: 'cast', type: 'text' },
    { id: 'day_night_deps', text: "10. Are there scenes dependent on specific DAYLIGHT or NIGHT conditions? (Specify)", category: 'cast', type: 'text' },

    // E. Priority
    { id: 'first_scene', text: "11. Which scene would you prefer to shoot FIRST? (Scene ID)", category: 'priority', type: 'text' },
    { id: 'last_scene', text: "12. Which scene can be pushed to LAST or is optional?", category: 'priority', type: 'text' }
];

export function OperationalInterview({ onComplete, onClose }: OperationalInterviewProps) {
    const [messages, setMessages] = useState<{ role: 'ai' | 'user', content: string }[]>([
        { role: 'ai', content: "I am your 1st AD. I will generate a realistic shooting schedule based ONLY on your answers. No guessing allowed.\n\nLet's define the logistics for Day 1." }
    ]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial Question
    useEffect(() => {
        const timer = setTimeout(() => {
            askQuestion(0);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    // Auto-scroll
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const askQuestion = (index: number) => {
        if (index < QUESTIONS.length) {
            setIsTyping(true);
            setTimeout(() => {
                setMessages(prev => [...prev, { role: 'ai', content: QUESTIONS[index].text }]);
                setIsTyping(false);
            }, 800);
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
            setMessages(prev => [...prev, { role: 'ai', content: "Confirmed. Generating strict daily schedule and call sheet now." }]);
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
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">1st AD (System)</h3>
                        <p className="text-xs text-[#94a3b8]">Logistics Enforcement Mode</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-white transition-colors"
                >
                    <span className="text-xs font-bold uppercase tracking-wider">Cancel</span>
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
                            max-w-[80%] p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap
                            ${msg.role === 'user'
                                ? 'bg-emerald-600 text-white rounded-tr-none'
                                : 'bg-[#1e293b] text-white rounded-tl-none border border-[#334155]'}
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
            <div className="p-4 border-t border-[#334155] bg-[#020617]">
                {currentQ?.options ? (
                    <div className="flex flex-wrap gap-2">
                        {currentQ.options.map(opt => (
                            <button
                                key={opt}
                                onClick={() => handleSend(opt)}
                                className="bg-[#1e293b] hover:bg-emerald-600 border border-[#334155] hover:border-emerald-500 text-white px-4 py-2 rounded-full text-xs font-bold transition-all"
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
                            placeholder={currentQuestionIndex < QUESTIONS.length ? "Enter logic data..." : "Interview complete."}
                            disabled={currentQuestionIndex >= QUESTIONS.length}
                            className="flex-1 bg-[#1e293b] border border-[#334155] rounded-l-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                            autoFocus
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || currentQuestionIndex >= QUESTIONS.length}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <div className="mt-2 text-xs text-center text-[#64748b]">
                    Provide accurate logistical data. No creative assumptions.
                </div>
            </div>
        </div>
    );
}
