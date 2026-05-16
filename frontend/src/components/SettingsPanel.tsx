import { useState } from 'react';
import { X, Monitor, Keyboard, Palette, Wifi, Fingerprint, RefreshCw } from 'lucide-react';

interface SettingsPanelProps {
    onClose: () => void;
    onResetDesktop?: () => void;
}

export default function SettingsPanel({ onClose, onResetDesktop }: SettingsPanelProps) {
    const [activeSection, setActiveSection] = useState('display');
    const [resolution, setResolution] = useState('1280x720');
    const [keyboardLayout, setKeyboardLayout] = useState('us');
    const [theme, setTheme] = useState('dark');
    const [autoConnect, setAutoConnect] = useState(true);

    const sections = [
        { id: 'display', icon: Monitor, label: 'Display' },
        { id: 'keyboard', icon: Keyboard, label: 'Keyboard' },
        { id: 'appearance', icon: Palette, label: 'Appearance' },
        { id: 'network', icon: Wifi, label: 'Network' },
    ];

    const resolutions = ['1280x720', '1920x1080', '1366x768', '1440x900', '2560x1440', '375x667 (Mobile)'];
    const layouts = ['us', 'uk', 'de', 'fr', 'jp', 'es', 'it', 'br'];

    return (
        <div className="h-full bg-[#0a0a0a] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h2 className="text-sm font-black uppercase tracking-widest text-white">Settings</h2>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-gray-500"><X size={18} /></button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-40 border-r border-white/5 p-2 space-y-1">
                    {sections.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-bold transition-all ${activeSection === s.id ? 'bg-blue-600/20 text-blue-500' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}
                        >
                            <s.icon size={14} />
                            {s.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activeSection === 'display' && (
                        <>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Resolution</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {resolutions.map(r => (
                                        <button
                                            key={r}
                                            onClick={() => setResolution(r)}
                                            className={`px-4 py-3 rounded-xl text-[11px] font-bold transition-all text-left ${resolution === r ? 'bg-blue-600/20 border border-blue-500/30 text-blue-500' : 'bg-white/5 border border-transparent text-gray-400 hover:bg-white/10'}`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Scaling</label>
                                <div className="flex gap-2">
                                    {['Fit', 'Fill', '100%', '150%', '200%'].map(s => (
                                        <button key={s} className="flex-1 px-4 py-3 bg-white/5 rounded-xl text-[11px] font-bold text-gray-400 hover:bg-white/10 transition-all">{s}</button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {activeSection === 'keyboard' && (
                        <>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Layout</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {layouts.map(l => (
                                        <button
                                            key={l}
                                            onClick={() => setKeyboardLayout(l)}
                                            className={`px-4 py-3 rounded-xl text-[11px] font-bold uppercase transition-all ${keyboardLayout === l ? 'bg-blue-600/20 border border-blue-500/30 text-blue-500' : 'bg-white/5 border border-transparent text-gray-400 hover:bg-white/10'}`}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {activeSection === 'appearance' && (
                        <>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Theme</label>
                                <div className="flex gap-2">
                                    {['dark', 'light', 'system'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setTheme(t)}
                                            className={`flex-1 px-6 py-4 rounded-xl text-[11px] font-bold uppercase transition-all ${theme === t ? 'bg-blue-600/20 border border-blue-500/30 text-blue-500' : 'bg-white/5 border border-transparent text-gray-400 hover:bg-white/10'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {activeSection === 'network' && (
                        <>
                            <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Fingerprint size={18} className="text-blue-500" />
                                    <div>
                                        <div className="text-xs font-bold text-white">Auto-connect</div>
                                        <div className="text-[10px] text-gray-600">Reconnect on page load</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setAutoConnect(!autoConnect)}
                                    className={`w-10 h-6 rounded-full transition-all ${autoConnect ? 'bg-blue-600' : 'bg-gray-700'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full transition-all mt-1 ${autoConnect ? 'ml-5' : 'ml-1'}`} />
                                </button>
                            </div>

                            <button
                                onClick={onResetDesktop}
                                className="w-full flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl hover:bg-red-500/20 transition-all"
                            >
                                <RefreshCw size={18} className="text-red-500" />
                                <div className="text-left">
                                    <div className="text-xs font-bold text-red-500">Reset Desktop Session</div>
                                    <div className="text-[10px] text-gray-600">Restart VNC and container</div>
                                </div>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
