"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ProductionDocModel } from '@/lib/production/types';
import { Send, Sparkles, X, Loader2, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductionChatProps {
    docData: ProductionDocModel;
    onUpdate: (newDoc: ProductionDocModel) => void;
    onClose: () => void;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function ProductionChat({ docData, onUpdate, onClose }: ProductionChatProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hello! I'm your AI AD. Ask me to reschedule scenes, add breaks, or change call times." }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const res = await fetch('/api/assist/production', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentDoc: docData, prompt: userMsg })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to update");

            onUpdate(data.doc);
            setMessages(prev => [...prev, { role: 'assistant', content: "Done! I've updated the schedule for you." }]);

        } catch (err: any) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="w-80 bg-[#1e293b] border-l border-[#334155] flex flex-col h-full shadow-2xl absolute right-0 top-0 z-40"
        >
            <div className="p-4 border-b border-[#334155] flex justify-between items-center bg-[#0f172a]">
                <div className="flex items-center gap-2 font-bold text-white">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    AI Assistant
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-xl text-sm ${m.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-[#334155] text-gray-200 rounded-bl-none'
                            }`}>
                            {m.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-[#334155] p-3 rounded-xl rounded-bl-none flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                            <span className="text-xs text-gray-400">Processing changes...</span>
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-[#334155] bg-[#0f172a]">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="e.g. Move Scene 2 to end..."
                        className="w-full bg-[#1e293b] border border-[#334155] rounded-lg pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-2 p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-md text-white disabled:opacity-50 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </motion.div>
    );
}
