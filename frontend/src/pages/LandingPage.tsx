import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Terminal, Globe, Shield, Zap, ChevronRight, Sparkles, Cpu, Brain, Infinity } from 'lucide-react';

const FEATURES = [
    {
        icon: Zap, title: 'Neural Speed', desc: 'Powered by WebGL-accelerated terminal and edge-optimized compute for zero-latency development.',
        gradient: 'from-blue-500 to-cyan-500',
    },
    {
        icon: Globe, title: 'Global Mesh', desc: 'Instantly preview and deploy from our globally distributed edge network. Any device, anywhere.',
        gradient: 'from-purple-500 to-pink-500',
    },
    {
        icon: Shield, title: 'Quantum Isolation', desc: 'Military-grade container isolation with encrypted tunnels. Your workspace, impenetrable.',
        gradient: 'from-emerald-500 to-teal-500',
    },
    {
        icon: Brain, title: 'AI Context Engine', desc: 'Ambient AI that understands your codebase, predicts your intent, and automates the mundane.',
        gradient: 'from-orange-500 to-rose-500',
    },
    {
        icon: Infinity, title: 'Infinite Sessions', desc: 'Time-travel through your workspace history. Every keystoke preserved, every state recoverable.',
        gradient: 'from-indigo-500 to-violet-500',
    },
    {
        icon: Cpu, title: 'Cloud-Native VDI', desc: 'Full Linux desktop with VNC, VS Code-grade editor, and real-time collaboration built in.',
        gradient: 'from-amber-500 to-yellow-500',
    },
];

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-blue-500/30 font-sans overflow-x-hidden">
            {/* Ambient Neural Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-15%] left-[-5%] w-[70%] h-[70%] bg-blue-600/5 blur-[200px] rounded-full animate-pulse" style={{ animationDuration: '12s' }} />
                <div className="absolute bottom-[-15%] right-[-5%] w-[70%] h-[70%] bg-purple-600/5 blur-[200px] rounded-full animate-pulse" style={{ animationDuration: '16s' }} />
            </div>

            {/* Neural Glass Nav */}
            <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/5 px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Terminal size={20} className="text-white" />
                    </div>
                    <span className="text-lg sm:text-xl font-black tracking-tighter">V-PLATFORM</span>
                </div>
                <div className="hidden md:flex items-center gap-8">
                    {['Features', 'Enterprise', 'Pricing'].map(item => (
                        <a key={item} href={`#${item.toLowerCase()}`}
                            className="text-sm font-medium text-gray-500 hover:text-white transition-all">
                            {item}
                        </a>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/login" className="text-sm font-semibold text-gray-400 hover:text-white transition-all">Sign In</Link>
                    <Link to="/register"
                        className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-all active:scale-95">
                        Start Free
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 sm:pt-44 pb-16 sm:pb-24 px-4 sm:px-8 flex flex-col items-center text-center overflow-hidden">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-bold tracking-widest uppercase mb-6 sm:mb-8">
                        <Sparkles size={12} /> The Future of Computing
                    </span>
                    <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-200 to-gray-600 leading-[1.1]">
                        Your PC,<br />Reborn in the Cloud.
                    </h1>
                    <p className="max-w-xl mx-auto text-sm sm:text-lg text-gray-500 mb-8 sm:mb-10 leading-relaxed px-4">
                        The world's most advanced cloud workspace. A full Linux environment, AI co-pilot,
                        real-time collaboration, and enterprise security — in your browser. Zero lag. Any device.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/register"
                            className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3.5 sm:px-10 sm:py-4 rounded-full text-base sm:text-lg font-bold shadow-2xl shadow-blue-600/40 transition-all flex items-center gap-2 active:scale-95">
                            Deploy Free <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a href="#features" className="text-sm sm:text-base font-semibold text-gray-500 hover:text-blue-500 transition-colors">
                            Explore Features
                        </a>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 1 }}
                    className="mt-16 sm:mt-24 w-full max-w-5xl rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-3xl p-2 sm:p-3 shadow-[0_0_100px_-20px_rgba(59,130,246,0.3)]"
                >
                    <div className="aspect-video bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden flex items-center justify-center border border-white/5 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-600/5 to-transparent" />
                        <div className="flex flex-col items-center gap-4 relative">
                            <Terminal size={60} className="text-blue-500/20" />
                            <div className="flex items-center gap-2 text-[10px] font-mono text-gray-800">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                Neural Cloud Active · 0.2ms latency
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-20 sm:py-32 px-4 sm:px-8 max-w-7xl mx-auto relative">
                <div className="text-center mb-16">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-gray-500 text-[9px] font-bold tracking-widest uppercase mb-4">
                        Everything You Need
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                        Beyond a PC.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">A Neural Workspace.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {FEATURES.map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="group p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-500 relative overflow-hidden"
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-5 blur-[60px] rounded-full transition-all duration-700`} />
                            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${f.gradient} bg-opacity-10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                <f.icon size={20} className="text-white" />
                            </div>
                            <h3 className="text-lg font-bold mb-3 text-white">{f.title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 sm:py-32 px-4 sm:px-8 text-center relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-gradient-to-r from-blue-600/10 to-purple-600/10 blur-[150px] rounded-full pointer-events-none" />
                <div className="relative">
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-6">
                        Ready to transcend?
                    </h2>
                    <p className="text-gray-500 text-base sm:text-lg mb-10 max-w-lg mx-auto">
                        Join the neural cloud revolution. Your workspace, infinitely scalable, accessible from anywhere.
                    </p>
                    <Link to="/register"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-4 rounded-full text-lg font-bold shadow-2xl shadow-blue-600/40 transition-all active:scale-95">
                        Deploy Free <ChevronRight size={18} />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-8 px-4 sm:px-8 text-center text-[10px] text-gray-800 font-mono">
                V-PLATFORM · The Neural Cloud Workspace · {new Date().getFullYear()}
            </footer>
        </div>
    );
}
