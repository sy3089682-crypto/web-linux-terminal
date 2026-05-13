import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { 
    ChevronLeft, Terminal as TermIcon, Shield, Folder, File as FileIcon, 
    RefreshCw, HardDrive, Cpu, Activity, X, Layout, Save, Sparkles, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import '@xterm/xterm/css/xterm.css';

interface FileItem {
    name: string;
    isDirectory: boolean;
    path: string;
}

export default function IDEPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [currentPath, setCurrentPath] = useState('');
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
    const [fileContent, setFileContent] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isAIOpen, setIsAIOpen] = useState(false);
    const [aiMessages, setAiMessages] = useState<{ role: string, text: string }[]>([]);
    const [aiInput, setAiInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchFiles = async (dir = '') => {
        try {
            const res = await axios.get(`http://localhost:3001/api/files/list?instanceId=${id}&dirPath=${dir}`);
            setFiles(res.data);
            setCurrentPath(dir);
        } catch (err) {}
    };

    const openFile = async (file: FileItem) => {
        if (file.isDirectory) {
            fetchFiles(file.path);
        } else {
            try {
                const res = await axios.get(`http://localhost:3001/api/files/read?instanceId=${id}&filePath=${file.path}`);
                setFileContent(res.data.content);
                setSelectedFile(file);
            } catch (err) {}
        }
    };

    const saveFile = async () => {
        if (!selectedFile) return;
        setIsSaving(true);
        try {
            await axios.post('http://localhost:3001/api/files/save', {
                instanceId: id,
                filePath: selectedFile.path,
                content: fileContent
            });
            setTimeout(() => setIsSaving(false), 500);
        } catch (err) {
            setIsSaving(false);
        }
    };

    const handleAISend = () => {
        if (!aiInput.trim()) return;
        const userMsg = { role: 'user', text: aiInput };
        setAiMessages([...aiMessages, userMsg]);
        setAiInput('');
        
        // Mock AI Response
        setTimeout(() => {
            const aiMsg = { role: 'ai', text: `As your Google-tier assistant, I've analyzed your request about "${aiInput}". Your architecture looks solid, but consider optimizing your Docker volume mounts for better performance.` };
            setAiMessages(prev => [...prev, aiMsg]);
        }, 1000);
    };

    useEffect(() => {
        fetchFiles();
    }, [id]);

    useEffect(() => {
        if (!terminalRef.current || !token || !id) return;

        const term = new Terminal({
            cursorBlink: true,
            fontFamily: '"Fira Code", monospace',
            fontSize: 14,
            theme: {
                background: '#0a0a0a',
                foreground: '#d4d4d4',
                cursor: '#f8f8f2',
            },
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        setTimeout(() => fitAddon.fit(), 100);
        
        xtermRef.current = term;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const socket = new WebSocket(`${protocol}//${window.location.hostname}:3001?token=${token}&instanceId=${id}`);

        socket.onopen = () => {
            term.writeln('\x1b[1;32m●\x1b[0m Google-Tier Cloud Session Active');
            socket.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
        };

        socket.onmessage = (event) => term.write(event.data);
        term.onData((data) => {
            if (socket.readyState === WebSocket.OPEN) socket.send(data);
        });

        const handleResize = () => {
            fitAddon.fit();
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            socket.close();
            term.dispose();
        };
    }, [id, token]);

    return (
        <div className="h-screen w-screen bg-[#0a0a0a] flex flex-col overflow-hidden text-gray-300 font-sans">
            {/* Header */}
            <header className="h-14 bg-[#111] border-b border-white/5 flex items-center justify-between px-4 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/5 rounded-lg transition-all text-gray-400 hover:text-white">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                            <TermIcon size={14} className="text-white" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-white">V-IDE PRO</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {selectedFile && (
                        <button 
                            onClick={saveFile}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isSaving ? 'bg-green-600 text-white' : 'bg-blue-600/10 text-blue-500 border border-blue-600/20 hover:bg-blue-600 hover:text-white'}`}
                        >
                            <Save size={14} /> {isSaving ? 'SAVED' : 'SAVE'}
                        </button>
                    )}
                    <button 
                        onClick={() => setIsAIOpen(!isAIOpen)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isAIOpen ? 'bg-purple-600 text-white' : 'bg-purple-600/10 text-purple-500 border border-purple-600/20 hover:bg-purple-600 hover:text-white'}`}
                    >
                        <Sparkles size={14} /> AI ASSISTANT
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <PanelGroup direction="horizontal">
                    {/* Explorer */}
                    <AnimatePresence>
                        {isSidebarOpen && (
                            <Panel defaultSize={20} minSize={15}>
                                <aside className="h-full border-r border-white/5 flex flex-col bg-[#111]/30 backdrop-blur-md">
                                    <div className="p-4 flex items-center justify-between border-b border-white/5">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Workspace</span>
                                        <button onClick={() => fetchFiles(currentPath)} className="p-1 hover:text-white transition-colors">
                                            <RefreshCw size={14} />
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2">
                                        <div className="space-y-0.5">
                                            {currentPath && (
                                                <button 
                                                    onClick={() => fetchFiles(currentPath.split('/').slice(0, -1).join('/'))}
                                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-white/5 rounded transition-all text-blue-500"
                                                >
                                                    <Folder size={16} /> ..
                                                </button>
                                            )}
                                            {files.map(file => (
                                                <button 
                                                    key={file.path}
                                                    onClick={() => openFile(file)}
                                                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-all group ${selectedFile?.path === file.path ? 'bg-blue-600/10 text-blue-500' : 'hover:bg-white/5'}`}
                                                >
                                                    {file.isDirectory ? <Folder size={16} className="text-blue-500" /> : <FileIcon size={16} className="text-gray-500" />}
                                                    <span className="truncate group-hover:text-white">{file.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </aside>
                            </Panel>
                        )}
                    </AnimatePresence>

                    <PanelResizeHandle className="w-1 bg-transparent hover:bg-blue-600/20 transition-colors" />

                    {/* Main IDE (Editor + Terminal) */}
                    <Panel defaultSize={60}>
                        <PanelGroup direction="vertical">
                            <Panel defaultSize={65}>
                                <div className="h-full bg-black relative">
                                    {selectedFile ? (
                                        <Editor
                                            theme="vs-dark"
                                            defaultLanguage="javascript"
                                            value={fileContent}
                                            onChange={(val) => setFileContent(val || '')}
                                            options={{
                                                fontSize: 14,
                                                minimap: { enabled: false },
                                                scrollBeyondLastLine: false,
                                                padding: { top: 20 },
                                                automaticLayout: true,
                                            }}
                                        />
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-600">
                                            <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-4">
                                                <FileIcon size={32} />
                                            </div>
                                            <p className="text-sm">Select a file to start editing</p>
                                        </div>
                                    )}
                                </div>
                            </Panel>
                            
                            <PanelResizeHandle className="h-1 bg-transparent hover:bg-blue-600/20 transition-colors" />

                            <Panel defaultSize={35}>
                                <div className="h-full bg-black relative p-2 border-t border-white/5">
                                    <div className="absolute top-2 right-4 text-[10px] font-bold text-gray-700 tracking-widest z-10">TERMINAL</div>
                                    <div className="w-full h-full" ref={terminalRef}></div>
                                </div>
                            </Panel>
                        </PanelGroup>
                    </Panel>

                    {/* AI Assistant */}
                    {isAIOpen && (
                        <>
                            <PanelResizeHandle className="w-1 bg-transparent hover:bg-blue-600/20 transition-colors" />
                            <Panel defaultSize={20} minSize={15}>
                                <aside className="h-full bg-[#111] border-l border-white/5 flex flex-col">
                                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                        <span className="text-xs font-bold text-purple-500 flex items-center gap-2">
                                            <Sparkles size={14} /> AI COPILOT
                                        </span>
                                        <button onClick={() => setIsAIOpen(false)} className="p-1 hover:text-white">
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                        {aiMessages.map((msg, i) => (
                                            <div key={i} className={`p-3 rounded-xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-blue-600/10 text-blue-300 ml-4' : 'bg-purple-600/10 text-purple-300 mr-4'}`}>
                                                {msg.text}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 border-t border-white/5">
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                placeholder="Ask anything..."
                                                className="w-full bg-black border border-white/10 rounded-lg pl-4 pr-10 py-2 text-xs focus:outline-none focus:border-purple-600 transition-all"
                                                value={aiInput}
                                                onChange={(e) => setAiInput(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleAISend()}
                                            />
                                            <button 
                                                onClick={handleAISend}
                                                className="absolute right-2 top-1.5 p-1 text-gray-500 hover:text-purple-500"
                                            >
                                                <Send size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </aside>
                            </Panel>
                        </>
                    )}
                </PanelGroup>
            </div>
        </div>
    );
}
