import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, X, Terminal, Folder, Code,
    Check, Grid
} from 'lucide-react';

interface Desktop {
    id: string;
    name: string;
    apps: { name: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string }[];
    color: string;
}

export default function MultiDesktop({ activeTab, onSwitchTab }: { activeTab: string; onSwitchTab: (tab: string) => void }) {
    const [desktops, setDesktops] = useState<Desktop[]>([
        { id: '1', name: 'Main', apps: [{ name: 'Terminal', icon: Terminal, color: 'text-green-500' }], color: 'from-blue-600 to-indigo-700' },
        { id: '2', name: 'Code', apps: [{ name: 'Editor', icon: Code, color: 'text-blue-500' }], color: 'from-purple-600 to-pink-700' },
        { id: '3', name: 'Files', apps: [{ name: 'Files', icon: Folder, color: 'text-yellow-500' }], color: 'from-emerald-600 to-teal-700' },
    ]);
    const [activeDesktop, setActiveDesktop] = useState('1');
    const [showOverview, setShowOverview] = useState(false);

    const addDesktop = () => {
        const id = (desktops.length + 1).toString();
        const colors = ['from-orange-600 to-red-700', 'from-cyan-600 to-blue-700', 'from-pink-600 to-rose-700', 'from-lime-600 to-green-700'];
        const newDesktop: Desktop = {
            id,
            name: `Desktop ${id}`,
            apps: [],
            color: colors[desktops.length % colors.length],
        };
        setDesktops(prev => [...prev, newDesktop]);
        setActiveDesktop(id);
    };

    const removeDesktop = (id: string) => {
        if (desktops.length <= 1) return;
        setDesktops(prev => prev.filter(d => d.id !== id));
        if (activeDesktop === id) setActiveDesktop(desktops[0].id);
    };

    return (
        <>
            {/* Desktop indicator bar */}
            <div className="flex items-center gap-1 px-3 py-1.5 bg-[#0d0d0d] border-b border-white/5 overflow-x-auto no-scrollbar">
                {desktops.map(desktop => (
                    <button
                        key={desktop.id}
                        onClick={() => setActiveDesktop(desktop.id)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shrink-0 relative
                            ${activeDesktop === desktop.id
                                ? 'text-white'
                                : 'text-gray-700 hover:text-gray-500'}`}
                    >
                        {activeDesktop === desktop.id && (
                            <motion.div layoutId="desktop-bg"
                                className={`absolute inset-0 rounded-lg bg-gradient-to-r ${desktop.color} opacity-30`}
                            />
                        )}
                        <span className="relative z-10">{desktop.name}</span>
                        {desktops.length > 1 && (
                            <button onClick={(e) => { e.stopPropagation(); removeDesktop(desktop.id); }}
                                className="relative z-10 p-0.5 rounded hover:bg-white/10 text-gray-800 hover:text-red-500 ml-1">
                                <X size={8} />
                            </button>
                        )}
                    </button>
                ))}
                <button onClick={addDesktop}
                    className="p-1 rounded-lg hover:bg-white/5 text-gray-700 hover:text-blue-500 shrink-0">
                    <Plus size={12} />
                </button>

                <div className="ml-auto flex items-center gap-1">
                    <button onClick={() => setShowOverview(!showOverview)}
                        className={`p-1.5 rounded-lg transition-all ${showOverview ? 'bg-blue-600/20 text-blue-500' : 'text-gray-700 hover:text-gray-500'}`}
                        title="Desktop Overview"
                    >
                        <Grid size={12} />
                    </button>
                </div>
            </div>

            {/* Desktop Overview (full-screen grid) */}
            <AnimatePresence>
                {showOverview && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-2xl p-8"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-lg font-black text-white">Desktop Overview</h2>
                            <button onClick={() => setShowOverview(false)}
                                className="p-2 rounded-xl hover:bg-white/10 text-gray-500">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {desktops.map(desktop => (
                                <motion.button
                                    key={desktop.id}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => { setActiveDesktop(desktop.id); setShowOverview(false); }}
                                    className={`relative rounded-2xl border overflow-hidden aspect-video transition-all group
                                        ${activeDesktop === desktop.id ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-white/10 hover:border-white/30'}`}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${desktop.color} opacity-20`} />
                                    <div className="relative p-4 h-full flex flex-col justify-between">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-white">{desktop.name}</span>
                                            {activeDesktop === desktop.id && <Check size={14} className="text-blue-500" />}
                                        </div>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {desktop.apps.map((app, i) => (
                                                <div key={i} className="p-1.5 bg-white/10 rounded-lg">
                                                    <app.icon size={12} className={app.color} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                            <button onClick={addDesktop}
                                className="rounded-2xl border-2 border-dashed border-white/10 hover:border-blue-500/50 aspect-video flex flex-col items-center justify-center gap-2 text-gray-700 hover:text-blue-500 transition-all"
                            >
                                <Plus size={24} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Add Desktop</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tab quick-switcher per desktop */}
            <div className="flex items-center gap-1 px-3 py-1.5 bg-black/50 border-b border-white/5 overflow-x-auto no-scrollbar">
                {['terminal', 'editor', 'desktop', 'files', 'stats', 'settings'].map(tab => (
                    <button key={tab}
                        onClick={() => onSwitchTab(tab)}
                        className={`px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all shrink-0
                            ${activeTab === tab ? 'text-blue-500 bg-blue-600/10' : 'text-gray-800 hover:text-gray-600'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </>
    );
}
