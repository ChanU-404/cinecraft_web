import { signIn } from "next-auth/react";
import { Clapperboard, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function LoginView() {
    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1e293b] via-[#020617] to-black opacity-80" />
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-12 items-center relative z-10"
            >

                {/* Left Side: Brand & Value */}
                <div className="space-y-8 p-8 text-center md:text-left">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring" }}
                        className="inline-flex items-center gap-3 text-[#ff365c]"
                    >
                        <Clapperboard className="w-12 h-12" />
                        <h1 className="text-4xl font-black italic tracking-tighter">CINECRAFT</h1>
                    </motion.div>

                    <div className="space-y-4">
                        <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                            Visualize Your Screenplay <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff365c] to-[#ff8f00]">
                                In Seconds, Not Days.
                            </span>
                        </h2>
                        <p className="text-[#94a3b8] text-lg leading-relaxed">
                            Transform PDF scripts into AI-generated storyboards, shooting schedules, and detailed production shots instantly.
                        </p>
                    </div>

                    <div className="flex gap-4 items-center justify-center md:justify-start text-sm font-bold text-[#64748b] tracking-wider uppercase">
                        <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#fbbf24]" /> AI Powered</span>
                        <span className="w-1 h-1 bg-[#334155] rounded-full" />
                        <span>Secure</span>
                        <span className="w-1 h-1 bg-[#334155] rounded-full" />
                        <span>Production Ready</span>
                    </div>
                </div>

                {/* Right Side: Login Card */}
                <div className="bg-[#111827]/50 backdrop-blur-xl border border-[#1f2937] p-8 md:p-12 rounded-3xl shadow-2xl flex flex-col gap-8">
                    <div className="text-center">
                        <h3 className="text-white font-bold text-xl mb-2">Welcome Back, Director.</h3>
                        <p className="text-[#94a3b8] text-sm">Sign in with your Google account to continue.</p>
                    </div>

                    <button
                        onClick={() => signIn("google")}
                        className="w-full bg-white text-[#0f172a] hover:bg-gray-100 font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-transform hover:scale-[1.02]"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    {process.env.NODE_ENV === 'development' && (
                        <button
                            onClick={() => signIn("credentials")}
                            className="w-full bg-[#1e293b] text-[#94a3b8] hover:bg-[#334155] hover:text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm border border-[#334155] border-dashed"
                        >
                            <span>🛠️ Dev Mode: Mock Login</span>
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
