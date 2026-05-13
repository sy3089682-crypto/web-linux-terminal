import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Terminal, Cpu, Globe, Shield, Zap, ChevronRight } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-blue-500/30 font-sans">
            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-8 h-20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Terminal size={24} className="text-white" />
                    </div>
                    <span className="text-xl font-black tracking-tighter">V-PLATFORM</span>
                </div>
                <div className="hidden md:flex items-center gap-10">
                    <a href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Features</a>
                    <a href="#pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Pricing</a>
                    <a href="#enterprise" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Enterprise</a>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-sm font-semibold hover:text-blue-500 transition-colors">Sign In</Link>
                    <Link to="/register" className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-bold hover:bg-gray-200 transition-all">Start Free</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 px-8 flex flex-col items-center text-center overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full -z-10 animate-pulse" />
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <span className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-bold tracking-widest uppercase mb-8 inline-block">
                        The Future of Development is Here
                    </span>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
                        Deploy your code<br />in the cloud.
                    </h1>
                    <p className="max-w-2xl text-lg md:text-xl text-gray-400 mb-12 leading-relaxed">
                        Experience the ultimate cloud development platform. Persistent Linux environments, 
                        real-time collaboration, and enterprise-grade performance. Ready in seconds.
                    </p>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <Link to="/register" className="group bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-full text-lg font-bold shadow-2xl shadow-blue-600/40 transition-all flex items-center gap-2">
                            Deploy Now <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a href="#demo" className="text-lg font-semibold hover:text-blue-500 transition-colors">Watch Demo</a>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 1 }}
                    className="mt-24 w-full max-w-5xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur-3xl p-4 shadow-[0_0_100px_-20px_rgba(59,130,246,0.5)]"
                >
                    <div className="aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-white/5">
                        <Terminal size={80} className="text-blue-500/20 animate-pulse" />
                    </div>
                </motion.div>
            </section>

            {/* Feature Grid */}
            <section id="features" className="py-32 px-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {[
                        { title: 'Extreme Speed', icon: Zap, desc: 'Powered by high-performance NVMe storage and the latest vCPUs for zero-latency development.' },
                        { title: 'Global Edge', icon: Globe, desc: 'Instantly preview your web applications with our globally distributed port-forwarding network.' },
                        { title: 'Ironclad Security', icon: Shield, desc: 'Every instance is isolated in a secure, multi-tenant container environment with advanced encryption.' },
                    ].map((f, i) => (
                        <div key={i} className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <f.icon className="text-blue-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-4">{f.title}</h3>
                            <p className="text-gray-400 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
