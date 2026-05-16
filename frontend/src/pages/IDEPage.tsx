import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import {
    ChevronLeft, Terminal as TermIcon, Shield,
    X, Save, Sparkles, Send,
    Monitor, Code, Grid3X3, Command,
    Fingerprint, Brain, Zap, Globe, History,
} from 'lucide-react';
import 'xterm/css/xterm.css';
import type { FileItem, Instance, AIMessage } from '../types';
import DesktopViewer from '../components/DesktopViewer';
import FileManager from '../components/FileManager';
import SystemMonitor from '../components/SystemMonitor';
import QuickActions from '../components/QuickActions';
import SettingsPanel from '../components/SettingsPanel';
import CommandPalette from '../components/CommandPalette';
import AITerminal from '../components/AITerminal';
import GitClient from '../components/GitClient';
import AppDashboard from '../components/AppDashboard';
import MultiDesktop from '../components/MultiDesktop';
import AIAgent from '../components/AIAgent';
import FileVersioning from '../components/FileVersioning';

import { initClipboardSync, onClipboard } from '../services/clipboard';

type TabId = 'terminal' | 'editor' | 'desktop' | 'files' | 'stats' | 'settings' | 'git' | 'apps' | 'agent' | 'versions';

const NEURAL_TABS: { id: TabId; icon: React.ComponentType<{ size?: number; className?: string }>; label: string; glow: string }[] = [
    { id: 'terminal', icon: TermIcon, label: 'Terminal', glow: 'from-emerald-500/20 to-emerald-500/5' },
    { id: 'editor', icon: Code, label: 'Editor', glow: 'from-blue-500/20 to-blue-500/5' },
    { id: 'desktop', icon: Monitor, label: 'Desktop', glow: 'from-violet-500/20 to-violet-500/5' },
    { id: 'files', icon: Grid3X3, label: 'Files', glow: 'from-amber-500/20 to-amber-500/5' },
    { id: 'agent', icon: Brain, label: 'AI', glow: 'from-purple-500/20 to-purple-500/5' },
    { id: 'stats', icon: Zap, label: 'Stats', glow: 'from-rose-500/20 to-rose-500/5' },
    { id: 'git', icon: Globe, label: 'Git', glow: 'from-orange-500/20 to-orange-500/5' },
    { id: 'versions', icon: History, label: 'Versions', glow: 'from-cyan-500/20 to-cyan-500/5' },
    { id: 'apps', icon: Command, label: 'Market', glow: 'from-pink-500/20 to-pink-500/5' },
    { id: 'settings', icon: Fingerprint, label: 'Settings', glow: 'from-gray-500/20 to-gray-500/5' },
];

const TAB_SHORTCUTS: Record<string, TabId> = {
    '1': 'terminal', '2': 'editor', '3': 'desktop', '4': 'files',
    '5': 'agent', '6': 'stats', '7': 'git', '8': 'versions',
    '9': 'apps', '0': 'settings',
};

export default function IDEPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const auth = useAuth();
    const token = auth?.token ?? null;
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);

    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
    const [fileContent, setFileContent] = useState('');
    const [isAIOpen, setIsAIOpen] = useState(false);
    const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
    const [aiInput, setAiInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [instance, setInstance] = useState<Instance | null>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [activeTab, setActiveTab] = useState<TabId>('terminal');
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [clipboardText, setClipboardText] = useState('');
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [allFiles, setAllFiles] = useState<{ name: string; path: string }[]>([]);
    const [isAIOrbExpanded, setIsAIOrbExpanded] = useState(false);
    useEffect(() => {
        const h = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', h);
        return () => window.removeEventListener('resize', h);
    }, []);

    useEffect(() => {
        if (!id) return;
        api.get(`/api/files/list?instanceId=${id}&dirPath=`).then(res => {
            const items = res.data || [];
            const flatten = (files: any[], prefix = ''): { name: string; path: string }[] =>
                files.flatMap((f: any) =>
                    f.isDirectory
                        ? flatten([], `${prefix}${f.name}/`)
                        : [{ name: f.name, path: `${prefix}${f.name}` }]
                );
            setAllFiles(flatten(items));
        }).catch(() => {});
    }, [id]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setShowCommandPalette(true);
            }
            if ((e.metaKey || e.ctrlKey) && e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                const tab = TAB_SHORTCUTS[e.key];
                if (tab) setActiveTab(tab);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const editorRef = useRef<any>(null);
    const providerRef = useRef<WebsocketProvider | null>(null);
    const docRef = useRef<Y.Doc | null>(null);

    const setupCollaboration = (editor: any, filePath: string) => {
        if (providerRef.current) providerRef.current.destroy();
        if (docRef.current) docRef.current.destroy();
        const doc = new Y.Doc();
        docRef.current = doc;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const provider = new WebsocketProvider(`${protocol}//${window.location.host}/collaboration`, `${id}-${filePath}`, doc);
        providerRef.current = provider;
        const type = doc.getText('monaco');
        new MonacoBinding(type, editor.getModel(), new Set([editor]), provider.awareness);
    };

    const handleEditorDidMount = (editor: any) => {
        editorRef.current = editor;
        if (selectedFile) setupCollaboration(editor, selectedFile.path);
    };

    const openFile = async (file: FileItem) => {
        if (file.isDirectory) return;
        try {
            const res = await api.get(`/api/files/read?instanceId=${id}&filePath=${file.path}`);
            setFileContent(res.data.content);
            setSelectedFile(file);
            setActiveTab('editor');
            if (editorRef.current) setupCollaboration(editorRef.current, file.path);
        } catch { console.error('Failed to open file'); }
    };

    const openFileByPath = async (path: string) => {
        await openFile({ name: path.split('/').pop() || path, path, isDirectory: false });
    };

    const saveFile = async () => {
        if (!selectedFile) return;
        setIsSaving(true);
        await api.post('/api/files/save', { instanceId: id, filePath: selectedFile.path, content: fileContent });
        setTimeout(() => setIsSaving(false), 500);
    };

    const handleAISend = async () => {
        if (!aiInput.trim()) return;
        setAiMessages(prev => [...prev, { role: 'user' as const, text: aiInput }]);
        const currentInput = aiInput;
        setAiInput('');
        try {
            const context = selectedFile ? `File: ${selectedFile.name}\nContent:\n${fileContent}` : 'No file selected';
            const res = await api.post('/api/ai/ask', { message: currentInput, fileContext: context });
            setAiMessages(prev => [...prev, { role: 'ai' as const, text: res.data.reply }]);
        } catch {
            setAiMessages(prev => [...prev, { role: 'ai', text: 'AI Service Unavailable. Check API Key.' }]);
        }
    };

    const socketRef = useRef<globalThis.WebSocket | null>(null);
    const runCommand = useCallback((cmd: string) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(`${cmd}\n`);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        api.get('/api/instances').then(res => {
            if (!cancelled) {
                const inst = res.data.find((i: Instance) => i._id === id);
                setInstance(inst);
                if (inst?.template === 'desktop') setActiveTab('desktop');
            }
        }).catch(() => console.error('Failed to fetch instance'));
        return () => { cancelled = true; };
    }, [id]);

    useEffect(() => {
        if (!terminalRef.current || !token || !id) return;
        const term = new XTerm({
            cursorBlink: true,
            fontFamily: '"Fira Code", "Cascadia Code", monospace',
            fontSize: isMobile ? 12 : 14,
            theme: { background: '#0a0a0a', foreground: '#d4d4d4', cursor: '#f8f8f2', selectionBackground: '#404040' },
            allowProposedApi: true,
        });
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        setTimeout(() => fitAddon.fit(), 100);
        xtermRef.current = term;

        const wsHost = import.meta.env.VITE_WS_URL || window.location.host;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const socket = new WebSocket(`${protocol}//${wsHost}?token=${token}&instanceId=${id}`);
        socketRef.current = socket;

        socket.onopen = () => {
            term.writeln('\x1b[1;32m◆\x1b[0m V-PLATFORM Neural Cloud Active');
            term.writeln('\x1b[1;34m│\x1b[0m Type \x1b[1;33mhelp\x1b[0m for available commands');
            term.writeln('\x1b[1;34m│\x1b[0m Press \x1b[1;33m⌘K\x1b[0m for command palette');
            socket.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
        };
        socket.onmessage = (ev) => { term.write(ev.data); };
        term.onData((data) => { if (socket.readyState === WebSocket.OPEN) socket.send(data); });

        const resizer = () => {
            fitAddon.fit();
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
            }
        };
        window.addEventListener('resize', resizer);
        return () => {
            window.removeEventListener('resize', resizer);
            socket.close();
            term.dispose();
        };
    }, [id, token, isMobile]);

    useEffect(() => {
        if (!id || !token) return;
        const cleanup = initClipboardSync(id, token);
        const unsub = onClipboard((text) => setClipboardText(text));
        return () => { cleanup(); unsub(); };
    }, [id, token]);

    const handleFileSelectForEditor = (file: FileItem) => openFile(file);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'terminal':
                return <AITerminal onRunCommand={runCommand} />;
            case 'editor':
                return (
                    <div className="h-full flex flex-col bg-black">
                        {selectedFile && (
                            <div className="flex items-center justify-between px-4 py-1.5 bg-[#111] border-b border-white/5">
                                <span className="text-[10px] font-mono text-gray-500 truncate">{selectedFile.path}</span>
                                <button onClick={saveFile}
                                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-black transition-all ${isSaving ? 'bg-green-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                                    <Save size={12} /> {isSaving ? 'SAVED' : 'SAVE'}
                                </button>
                            </div>
                        )}
                        <div className="flex-1">
                            {selectedFile ? (
                                <Editor theme="vs-dark" defaultLanguage="javascript" value={fileContent}
                                    onMount={handleEditorDidMount}
                                    onChange={(val) => setFileContent(val || '')}
                                    options={{ fontSize: 13, minimap: { enabled: false }, automaticLayout: true, padding: { top: 16 } }} />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-800">
                                    <Code size={40} className="mb-4 opacity-20" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Open a file from Files tab or Cmd+K</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'desktop':
                return instance?.slug ? (
                    <DesktopViewer url={`http://${instance.slug}.${window.location.hostname}:3001`} instanceSlug={instance.slug} />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-800 bg-black">
                        <Monitor size={48} className="mb-4 opacity-20" />
                        <p className="text-xs font-black uppercase tracking-widest">Start a Desktop instance from Dashboard</p>
                    </div>
                );
            case 'files':
                return id ? <FileManager instanceId={id} onOpenFile={handleFileSelectForEditor} /> : null;
            case 'git':
                return <GitClient instanceId={id || ''} onRunCommand={runCommand} />;
            case 'agent':
                return <AIAgent onRunCommand={runCommand}
                    context={{ files: selectedFile ? [{ path: selectedFile.path, content: fileContent }] : [] }} />;
            case 'versions':
                return id ? <FileVersioning instanceId={id}
                    onRestore={(content) => { setFileContent(content); setActiveTab('editor'); }} /> : null;
            case 'apps':
                return <AppDashboard onRunCommand={runCommand} />;
            case 'stats':
                return <SystemMonitor instanceId={id || ''} token={token} />;
            case 'settings':
                return (
                    <SettingsPanel
                        onClose={() => setActiveTab('terminal')}
                        onResetDesktop={() => { if (confirm('Reset desktop session?')) window.location.reload(); }}
                    />
                );
        }
    };

    return (
        <div className="h-screen w-screen bg-[#0a0a0a] flex flex-col overflow-hidden text-gray-300 font-sans select-none relative">
            {/* Ambient Neural Gradient Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/5 blur-[150px] rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/5 blur-[150px] rounded-full animate-pulse" style={{ animationDuration: '12s' }} />
            </div>

            {/* Header - Minimal Neural Glass */}
            <header className="h-11 bg-[#0d0d0d]/90 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-3 z-50 shrink-0 relative">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/dashboard')}
                        className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all">
                        <ChevronLeft size={16} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <TermIcon size={11} className="text-white" />
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-white hidden sm:block">V-PLATFORM</span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <button onClick={() => setShowCommandPalette(true)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                        <Command size={12} /> <kbd className="text-[8px] font-black text-gray-700">⌘K</kbd>
                    </button>

                    <div className="h-3 w-px bg-white/10 mx-0.5" />

                    {/* Neural AI Orb */}
                    <button onClick={() => { setIsAIOrbExpanded(!isAIOrbExpanded); setIsAIOpen(!isAIOpen); }}
                        className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[8px] font-black transition-all duration-500 ${isAIOpen ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                        <Sparkles size={11} />
                        <span className="hidden sm:inline">AI</span>
                        {isAIOpen && (
                            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" />
                        )}
                    </button>

                    {isMobile && (
                        <button onClick={() => setShowQuickActions(true)}
                            className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white">
                            <Grid3X3 size={14} />
                        </button>
                    )}

                    <div className="h-3 w-px bg-white/10 mx-0.5" />
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[7px] font-black border border-emerald-500/20">
                        <Shield size={7} /> {isMobile ? 'MOBILE' : 'LIVE'}
                    </div>
                </div>
            </header>

            {/* Multi-Desktop bar */}
            <MultiDesktop activeTab={activeTab} onSwitchTab={(tab) => setActiveTab(tab as TabId)} />

            {/* Main content area */}
            <div className="flex-1 flex overflow-hidden relative z-10">
                <div className="flex-1 overflow-hidden">
                    {renderTabContent()}
                </div>

                {/* AI Panel - Neural Glass */}
                {isAIOpen && (
                    <aside className="w-72 sm:w-80 border-l border-white/5 flex flex-col bg-[#0d0d0d]/95 backdrop-blur-2xl shrink-0 relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 to-transparent pointer-events-none" />
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 relative z-10">
                            <span className="flex items-center gap-2 text-[8px] font-black text-purple-500 uppercase tracking-[0.15em]">
                                <Sparkles size={10} /> Neural AI
                            </span>
                            <button onClick={() => { setIsAIOpen(false); setIsAIOrbExpanded(false); }} className="p-1 text-gray-500 hover:text-white"><X size={12} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-3 relative z-10">
                            {aiMessages.length === 0 && (
                                <div className="text-center py-8">
                                    <Brain size={28} className="mx-auto mb-3 text-purple-500/30" />
                                    <p className="text-xs font-bold text-gray-600 mb-1">Neural AI Context-Engine</p>
                                    <p className="text-[9px] text-gray-800 leading-relaxed">
                                        Ask questions about your code,<br />generate commands, or get help.
                                    </p>
                                </div>
                            )}
                            {aiMessages.map((msg, i) => (
                                <div key={i}
                                    className={`p-2.5 rounded-xl text-[9px] font-medium leading-relaxed ${msg.role === 'user' ? 'bg-blue-600/10 text-blue-400 ml-4 border border-blue-500/10' : 'bg-purple-600/10 text-purple-400 mr-4 border border-purple-500/10'}`}>
                                    {msg.text}
                                </div>
                            ))}
                        </div>
                        <div className="p-3 border-t border-white/5 bg-[#111]/80 relative z-10">
                            <div className="relative">
                                <input type="text" placeholder="Ask Neural AI..."
                                    className="w-full bg-black/80 border border-white/10 rounded-xl pl-3 pr-9 py-2 text-[10px] focus:outline-none focus:border-purple-600 transition-all font-medium"
                                    value={aiInput}
                                    onChange={(e) => setAiInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAISend()} />
                                <button onClick={handleAISend}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-purple-500">
                                    <Send size={12} />
                                </button>
                            </div>
                        </div>
                    </aside>
                )}
            </div>

            {/* Neural Dock - Floating Bottom Navigation (Mobile) / Side Dock (Desktop) */}
            {isMobile ? (
                <div className="relative z-20">
                    <div className="bg-[#0d0d0d]/95 backdrop-blur-2xl border-t border-white/5 px-1 py-1">
                        <div className="flex items-center justify-around">
                            {NEURAL_TABS.map(tab => {
                                const isActive = activeTab === tab.id;
                                const Icon = tab.icon;
                                return (
                                    <button key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`relative flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition-all duration-300 ${isActive ? 'text-white' : 'text-gray-700 hover:text-gray-500'}`}
                                    >
                                        {isActive && (
                                            <div className={`absolute inset-0 rounded-xl bg-gradient-to-b ${tab.glow} border border-white/5`} />
                                        )}
                                        <Icon size={16} className="relative z-10" />
                                        <span className={`relative z-10 text-[7px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                                            {tab.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="relative z-20">
                    <div className="bg-[#0d0d0d]/95 backdrop-blur-2xl border-t border-white/5 px-2 py-1.5">
                        <div className="flex items-center justify-center gap-1">
                            {NEURAL_TABS.map(tab => {
                                const isActive = activeTab === tab.id;
                                const Icon = tab.icon;
                                return (
                                    <button key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 ${isActive ? 'text-white' : 'text-gray-700 hover:text-gray-500'}`}
                                    >
                                        {isActive && (
                                            <div className={`absolute inset-0 rounded-lg bg-gradient-to-r ${tab.glow} border border-white/5`} />
                                        )}
                                        <Icon size={13} className="relative z-10" />
                                        <span className="relative z-10 text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Command Palette */}
            <CommandPalette
                isOpen={showCommandPalette}
                onClose={() => setShowCommandPalette(false)}
                onSwitchTab={(tab) => setActiveTab(tab as TabId)}
                onOpenFile={openFileByPath}
                onRunCommand={runCommand}
                onInstallPackage={(pkg) => runCommand(`apt install -y ${pkg}`)}
                files={allFiles}
            />

            {/* Quick Actions */}
            <QuickActions
                isOpen={showQuickActions}
                onClose={() => setShowQuickActions(false)}
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as TabId)}
                onRestart={() => window.location.reload()}
                onShare={() => {
                    navigator.clipboard.writeText(window.location.href).catch(() => {});
                }}
            />

            {/* Neural Clipboard Toast */}
            {clipboardText && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600/90 to-purple-600/90 text-white px-4 py-2 rounded-full text-[9px] font-bold shadow-2xl shadow-blue-600/30 z-50 backdrop-blur-xl border border-white/10">
                    <span className="flex items-center gap-2">
                        <Zap size={10} className="text-yellow-400" />
                        {clipboardText.slice(0, 50)}{clipboardText.length > 50 ? '...' : ''}
                    </span>
                </div>
            )}
        </div>
    );
}
