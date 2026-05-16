import { motion, AnimatePresence } from 'framer-motion';
import {
    Terminal as TermIcon, Monitor, Folder, BarChart3, Settings,
    RefreshCw, Share2, X, Keyboard
} from 'lucide-react';

interface QuickActionsProps {
    isOpen: boolean;
    onClose: () => void;
    activeTab: string;
    onTabChange: (tab: string) => void;
    onRestart?: () => void;
    onShare?: () => void;
}

const TABS = [
    { id: 'terminal', icon: TermIcon, label: 'Terminal', gradient: 'from-emerald-500 to-green-600' },
    { id: 'desktop', icon: Monitor, label: 'Desktop', gradient: 'from-blue-500 to-indigo-600' },
    { id: 'files', icon: Folder, label: 'Files', gradient: 'from-amber-500 to-orange-600' },
    { id: 'stats', icon: BarChart3, label: 'Stats', gradient: 'from-purple-500 to-pink-600' },
    { id: 'settings', icon: Settings, label: 'Settings', gradient: 'from-gray-500 to-gray-600' },
];

export default function QuickActions({ isOpen, onClose, activeTab, onTabChange, onRestart, onShare }: QuickActionsProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d0d] border-t border-white/5 rounded-t-3xl shadow-2xl"
                    >
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 bg-white/10 rounded-full" />
                        </div>

                        <div className="px-5 pb-2">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-xs font-black uppercase tracking-widest text-white">Quick Actions</h2>
                                <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-gray-500">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Tab switcher - horizontal scroll */}
                            <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
                                {TABS.map(t => {
                                    const isActive = activeTab === t.id;
                                    return (
                                        <button key={t.id}
                                            onClick={() => { onTabChange(t.id); onClose(); }}
                                            className={`flex flex-col items-center gap-2 p-4 min-w-[80px] rounded-2xl transition-all relative ${
                                                isActive
                                                    ? 'bg-gradient-to-br text-white shadow-lg'
                                                    : 'bg-white/5 text-gray-500 hover:bg-white/10'
                                            }`}
                                            style={isActive ? { backgroundImage: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` } : {}}
                                        >
                                            {isActive && (
                                                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${t.gradient} opacity-20`} />
                                            )}
                                            <t.icon size={22} className="relative z-10" />
                                            <span className="relative z-10 text-[8px] font-black uppercase tracking-widest">{t.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Utility buttons */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button onClick={onRestart}
                                    className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                                    <RefreshCw size={18} className="text-blue-500" />
                                    <div className="text-left">
                                        <div className="text-xs font-bold text-white">Restart Desktop</div>
                                        <div className="text-[9px] text-gray-600">Refresh cloud session</div>
                                    </div>
                                </button>
                                <button onClick={onShare}
                                    className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                                    <Share2 size={18} className="text-emerald-500" />
                                    <div className="text-left">
                                        <div className="text-xs font-bold text-white">Share Session</div>
                                        <div className="text-[9px] text-gray-600">Copy invite link</div>
                                    </div>
                                </button>
                            </div>

                            {/* Keyboard shortcuts */}
                            <div className="bg-black/50 rounded-2xl p-4 mb-6 border border-white/5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Keyboard size={14} className="text-gray-600" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Keyboard Shortcuts</span>
                                </div>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                    {[
                                        { key: 'ESC', val: 'Escape' },
                                        { key: 'TAB', val: 'Tab' },
                                        { key: '^C', val: 'Interrupt' },
                                        { key: '^D', val: 'EOF' },
                                        { key: '^L', val: 'Clear' },
                                        { key: '⌘K', val: 'Commands' },
                                    ].map(k => (
                                        <button key={k.key}
                                            onClick={() => { /* keyboard shortcut would go here */ }}
                                            className="flex flex-col items-center gap-1 bg-white/5 text-gray-400 px-3 py-2.5 rounded-xl font-black text-[10px] active:bg-blue-600 active:text-white transition-all min-w-[56px]"
                                        >
                                            <span>{k.key}</span>
                                            <span className="text-[7px] font-normal text-gray-700">{k.val}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
