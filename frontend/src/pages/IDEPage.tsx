import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { 
    ChevronLeft, Terminal as TermIcon, Shield, Folder, File as FileIcon, 
    RefreshCw, Activity, X, Layout, Save, Sparkles, Send, LineChart,
    FilePlus, FolderPlus, Trash2, MoreVertical, ExternalLink, UploadCloud, DownloadCloud, Monitor, 
    Code, Smartphone, Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { LineChart as ReLineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import '@xterm/xterm/css/xterm.css';

interface FileItem { name: string; isDirectory: boolean; path: string; }
interface StatPoint { cpu: number; memory: number; timestamp: string; }

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
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [isAIOpen, setIsAIOpen] = useState(false);
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [stats, setStats] = useState<StatPoint[]>([]);
    const [aiMessages, setAiMessages] = useState<{ role: string, text: string }[]>([]);
    const [aiInput, setAiInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [instance, setInstance] = useState<any>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, file: FileItem | null } | null>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [mobileActiveTab, setMobileActiveTab] = useState<'editor' | 'terminal' | 'pc' | 'explorer'>('terminal');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchInstance = async () => {
        try {
            const res = await axios.get(`http://localhost:3001/api/instances`);
            const inst = res.data.find((i: any) => i._id === id);
            setInstance(inst);
            if (inst?.template === 'desktop') setMobileActiveTab('pc');
        } catch (err) {}
    };

    const editorRef = useRef<any>(null);
    const providerRef = useRef<any>(null);
    const docRef = useRef<Y.Doc | null>(null);

    const setupCollaboration = (editor: any, filePath: string) => {
        if (providerRef.current) providerRef.current.destroy();
        if (docRef.current) docRef.current.destroy();
        const doc = new Y.Doc();
        docRef.current = doc;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const provider = new WebsocketProvider(`${protocol}//${window.location.hostname}:3001/collaboration`, `${id}-${filePath}`, doc);
        providerRef.current = provider;
        const type = doc.getText('monaco');
        new MonacoBinding(type, editor.getModel(), new Set([editor]), provider.awareness);
    };

    const handleEditorDidMount = (editor: any) => {
        editorRef.current = editor;
        if (selectedFile) setupCollaboration(editor, selectedFile.path);
    };

    const fetchFiles = async (dir = '') => {
        try {
            const res = await axios.get(`http://localhost:3001/api/files/list?instanceId=${id}&dirPath=${dir}`);
            setFiles(res.data);
            setCurrentPath(dir);
        } catch (err) {}
    };

    const openFile = async (file: FileItem) => {
        if (file.isDirectory) fetchFiles(file.path);
        else {
            const res = await axios.get(`http://localhost:3001/api/files/read?instanceId=${id}&filePath=${file.path}`);
            setFileContent(res.data.content);
            setSelectedFile(file);
            if (isMobile) setMobileActiveTab('editor');
            if (editorRef.current) setupCollaboration(editorRef.current, file.path);
        }
    };

    const saveFile = async () => {
        if (!selectedFile) return;
        setIsSaving(true);
        await axios.post('http://localhost:3001/api/files/save', { instanceId: id, filePath: selectedFile.path, content: fileContent });
        setTimeout(() => setIsSaving(false), 500);
    };

    const createFile = async () => {
        const name = prompt('File name:');
        if (!name) return;
        const filePath = currentPath ? `${currentPath}/${name}` : name;
        await axios.post('http://localhost:3001/api/files/create', { instanceId: id, filePath });
        fetchFiles(currentPath);
    };

    const createFolder = async () => {
        const name = prompt('Folder name:');
        if (!name) return;
        const dirPath = currentPath ? `${currentPath}/${name}` : name;
        await axios.post('http://localhost:3001/api/files/mkdir', { instanceId: id, dirPath });
        fetchFiles(currentPath);
    };

    const deleteFile = async (file: FileItem) => {
        if (!confirm(`Delete ${file.name}?`)) return;
        await axios.delete(`http://localhost:3001/api/files/delete?instanceId=${id}&filePath=${file.path}`);
        fetchFiles(currentPath);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const formData = new FormData();
        formData.append('file', e.target.files[0]);
        formData.append('instanceId', id || '');
        formData.append('dirPath', currentPath);
        try {
            await axios.post('http://localhost:3001/api/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            fetchFiles(currentPath);
        } catch (err) {}
    };

    const handleDownload = (file: FileItem) => {
        window.open(`http://localhost:3001/api/files/download?instanceId=${id}&filePath=${file.path}&token=${token}`);
        setContextMenu(null);
    };

    const handleAISend = async () => {
        if (!aiInput.trim()) return;
        const userMsg = { role: 'user', text: aiInput };
        setAiMessages(prev => [...prev, userMsg]);
        const currentInput = aiInput;
        setAiInput('');
        try {
            const context = selectedFile ? `File: ${selectedFile.name}\nContent:\n${fileContent}` : 'No file selected';
            const res = await axios.post('http://localhost:3001/api/ai/ask', { message: currentInput, fileContext: context });
            const aiMsg = { role: 'ai', text: res.data.reply };
            setAiMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            setAiMessages(prev => [...prev, { role: 'ai', text: "AI Service Unavailable. Check API Key." }]);
        }
    };

    const socketRef = useRef<WebSocket | null>(null);

    const sendKey = (key: string) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(key);
        }
    };

    useEffect(() => { 
        fetchFiles(); 
        fetchInstance();
    }, [id]);

    useEffect(() => {
        if (!terminalRef.current || !token || !id) return;
        const term = new Terminal({
            cursorBlink: true,
            fontFamily: '"Fira Code", monospace',
            fontSize: isMobile ? 12 : 14,
            theme: { background: '#0a0a0a', foreground: '#d4d4d4', cursor: '#f8f8f2' },
            allowProposedApi: true
        });
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        
        term.open(terminalRef.current);
        
        // Zero-Lag WebGL Engine
        try {
            const webglAddon = new WebglAddon();
            term.loadAddon(webglAddon);
        } catch (e) { console.warn('WebGL not supported, falling back to DOM'); }

        setTimeout(() => fitAddon.fit(), 100);
        xtermRef.current = term;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const socket = new WebSocket(`${protocol}//${window.location.hostname}:3001?token=${token}&instanceId=${id}`);
        socketRef.current = socket;

        socket.onopen = () => {
            term.writeln('\x1b[1;32m●\x1b[0m Google-Tier Zero-Lag Session Active');
            socket.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'stats') setStats(prev => [...prev.slice(-19), data.data]);
            } catch (e) { term.write(event.data); }
        };

        term.onData((data) => { if (socket.readyState === WebSocket.OPEN) socket.send(data); });
        
        const resizer = () => {
            fitAddon.fit();
            if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
        };
        window.addEventListener('resize', resizer);

        return () => { 
            window.removeEventListener('resize', resizer);
            socket.close(); 
            term.dispose(); 
        };
    }, [id, token, isMobile]);

    const DevKeyboard = () => (
        <div className="flex bg-[#111] border-t border-white/5 p-1 gap-1 overflow-x-auto no-scrollbar">
            {[
                { label: 'ESC', val: '\x1b' },
                { label: 'TAB', val: '\t' },
                { label: 'CTRL', val: '\x03' }, // Ctrl+C as default for this btn
                { label: 'ALT', val: '\x1ba' },
                { label: '←', val: '\x1b[D' },
                { label: '↑', val: '\x1b[A' },
                { label: '↓', val: '\x1b[B' },
                { label: '→', val: '\x1b[C' },
                { label: 'HOME', val: '\x1b[H' },
                { label: 'END', val: '\x1b[F' },
            ].map(k => (
                <button 
                    key={k.label} 
                    onClick={() => sendKey(k.val)}
                    className="bg-white/5 text-gray-400 px-3 py-2 rounded font-black text-[10px] active:bg-blue-600 active:text-white transition-all min-w-[50px]"
                >
                    {k.label}
                </button>
            ))}
        </div>
    );

    const MobileLayout = () => (
        <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                    {mobileActiveTab === 'explorer' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full bg-[#0a0a0a] flex flex-col p-4">
                            <div className="flex items-center justify-between mb-4"><span className="text-xs font-black uppercase tracking-widest text-gray-500">Explorer</span><button onClick={() => fetchFiles(currentPath)}><RefreshCw size={14}/></button></div>
                            <div className="flex-1 overflow-y-auto space-y-1">
                                {currentPath && <button onClick={() => fetchFiles(currentPath.split('/').slice(0, -1).join('/'))} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-500 bg-white/5 rounded">..</button>}
                                {files.map(f => (
                                    <button key={f.path} onClick={() => openFile(f)} className="w-full flex items-center gap-3 px-3 py-3 text-sm bg-white/5 rounded-xl border border-white/5">
                                        {f.isDirectory ? <Folder size={18} className="text-blue-500" /> : <FileIcon size={18} className="text-gray-500" />}
                                        <span className="truncate">{f.name}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                    {mobileActiveTab === 'editor' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                            {selectedFile ? (
                                <Editor theme="vs-dark" defaultLanguage="javascript" value={fileContent} onMount={handleEditorDidMount} onChange={(val) => setFileContent(val || '')} options={{ fontSize: 13, minimap: { enabled: false }, automaticLayout: true }} />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-700">
                                    <Code size={40} className="mb-4 opacity-20" />
                                    <p className="text-[10px] font-black">Open a file from Explorer</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                    {mobileActiveTab === 'terminal' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col">
                            <div className="flex-1 bg-black p-2" ref={terminalRef}></div>
                            <DevKeyboard />
                        </motion.div>
                    )}
                    {mobileActiveTab === 'pc' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                             <iframe src={`http://${instance?.slug}.localhost:3001`} className="w-full h-full border-0 bg-white" title="VDI" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {/* Floating Dock */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#111]/80 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-3 flex gap-8 shadow-2xl z-50">
                <button onClick={() => setMobileActiveTab('explorer')} className={mobileActiveTab === 'explorer' ? 'text-blue-500 scale-125 transition-all' : 'text-gray-500'}><Folder size={20}/></button>
                <button onClick={() => setMobileActiveTab('editor')} className={mobileActiveTab === 'editor' ? 'text-blue-500 scale-125 transition-all' : 'text-gray-500'}><Code size={20}/></button>
                <button onClick={() => setMobileActiveTab('terminal')} className={mobileActiveTab === 'terminal' ? 'text-blue-500 scale-125 transition-all' : 'text-gray-500'}><TermIcon size={20}/></button>
                <button onClick={() => setMobileActiveTab('pc')} className={mobileActiveTab === 'pc' ? 'text-blue-500 scale-125 transition-all' : 'text-gray-500'}><Monitor size={20}/></button>
            </div>
        </div>
    );

    const DesktopLayout = () => (
        <PanelGroup direction="horizontal">
            {isSidebarOpen && (
                <Panel defaultSize={18} minSize={10}>
                    <aside className="h-full border-r border-white/5 flex flex-col bg-[#0d0d0d]">
                        <div className="p-4 flex items-center justify-between border-b border-white/5">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">Workspace</span>
                            <div className="flex items-center gap-2">
                                <input type="file" className="hidden" ref={fileInputRef} onChange={handleUpload} />
                                <button onClick={() => fileInputRef.current?.click()} className="text-gray-600 hover:text-white" title="Upload"><UploadCloud size={12}/></button>
                                <button onClick={createFile} className="text-gray-600 hover:text-white" title="File"><FilePlus size={12}/></button>
                                <button onClick={() => fetchFiles(currentPath)} className="text-gray-600 hover:text-white"><RefreshCw size={12}/></button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {currentPath && <button onClick={() => fetchFiles(currentPath.split('/').slice(0, -1).join('/'))} className="w-full flex items-center gap-2 px-3 py-1 text-xs text-blue-500 hover:bg-white/5 rounded">..</button>}
                            {files.map(file => (
                                <button key={file.path} onClick={() => openFile(file)} onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, file }); }} className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded transition-all group ${selectedFile?.path === file.path ? 'bg-blue-600/10 text-blue-500' : 'hover:bg-white/5'}`}>
                                    {file.isDirectory ? <Folder size={14} className="text-blue-500" /> : <FileIcon size={14} className="text-gray-600" />}
                                    <span className="truncate group-hover:text-white">{file.name}</span>
                                </button>
                            ))}
                        </div>
                    </aside>
                </Panel>
            )}
            <PanelResizeHandle className="w-0.5 bg-white/5 hover:bg-blue-600/30 transition-all" />
            <Panel defaultSize={62}>
                {instance?.template === 'desktop' ? (
                    <div className="h-full bg-black relative"><iframe src={`http://${instance.slug}.localhost:3001`} className="w-full h-full border-0 bg-white" title="VDI" /></div>
                ) : (
                    <PanelGroup direction="vertical">
                        <Panel defaultSize={65}>
                            <div className="h-full bg-black relative">
                                {selectedFile ? (
                                    <Editor theme="vs-dark" defaultLanguage="javascript" value={fileContent} onMount={handleEditorDidMount} onChange={(val) => setFileContent(val || '')} options={{ fontSize: 13, minimap: { enabled: false }, automaticLayout: true, padding: { top: 16 } }} />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-800"><div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center mb-4"><FileIcon size={24} /></div><p className="text-[10px] font-black uppercase tracking-widest">Select file to edit</p></div>
                                )}
                            </div>
                        </Panel>
                        <PanelResizeHandle className="h-0.5 bg-white/5 hover:bg-blue-600/30 transition-all" />
                        <Panel defaultSize={35}><div className="h-full bg-black p-2 border-t border-white/5 relative"><div className="absolute top-2 right-4 text-[9px] font-black text-gray-800 tracking-widest z-10">CORE-SHELL</div><div className="w-full h-full" ref={terminalRef}></div></div></Panel>
                    </PanelGroup>
                )}
            </Panel>
            {isAIOpen && (
                <>
                    <PanelResizeHandle className="w-0.5 bg-white/5 hover:bg-blue-600/30 transition-all" />
                    <Panel defaultSize={20}>
                        <aside className="h-full bg-[#0d0d0d] border-l border-white/5 flex flex-col">
                            <div className="p-4 border-b border-white/5 flex items-center justify-between"><span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">AI Context-Engine</span><button onClick={() => setIsAIOpen(false)}><X size={16}/></button></div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">{aiMessages.map((msg, i) => (<div key={i} className={`p-4 rounded-2xl text-[11px] font-medium ${msg.role === 'user' ? 'bg-blue-600/10 text-blue-400 ml-4' : 'bg-purple-600/10 text-purple-400 mr-4'}`}>{msg.text}</div>))}</div>
                            <div className="p-4 border-t border-white/5 bg-[#111]"><div className="relative"><input type="text" placeholder="Explain code..." className="w-full bg-black border border-white/10 rounded-xl pl-4 pr-10 py-3 text-[11px] focus:outline-none focus:border-purple-600 transition-all font-medium" value={aiInput} onChange={(e) => setAiInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAISend()} /><button onClick={handleAISend} className="absolute right-3 top-2.5 p-1 text-gray-500 hover:text-purple-500"><Send size={16} /></button></div></div>
                        </aside>
                    </Panel>
                </>
            )}
        </PanelGroup>
    );

    return (
        <div className="h-screen w-screen bg-[#0a0a0a] flex flex-col overflow-hidden text-gray-300 font-sans select-none">
            <header className="h-14 bg-[#111] border-b border-white/5 flex items-center justify-between px-4 z-50">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/5 rounded-lg transition-all text-gray-400 hover:text-white"><ChevronLeft size={20} /></button>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center"><TermIcon size={14} className="text-white" /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white hidden sm:block">V-IDE PRO</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {selectedFile && <button onClick={saveFile} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${isSaving ? 'bg-green-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}><Save size={14} /> <span className="hidden sm:inline">{isSaving ? 'SAVED' : 'SAVE'}</span></button>}
                    <button onClick={() => setIsAIOpen(!isAIOpen)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${isAIOpen ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}><Sparkles size={14} /> <span className="hidden sm:inline">AI</span></button>
                    <div className="h-4 w-px bg-white/10 mx-1"></div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-500 text-[9px] font-black border border-green-500/20">
                        <Shield size={10} /> {isMobile ? 'PWA-NATIVE' : 'SECURE'}
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {isMobile ? <MobileLayout /> : <DesktopLayout />}
            </div>

            {contextMenu && (
                <div className="fixed bg-[#111] border border-white/10 rounded-lg shadow-2xl z-[100] p-1 min-w-[120px]" style={{ top: contextMenu.y, left: contextMenu.x }} onClick={() => setContextMenu(null)} onMouseLeave={() => setContextMenu(null)}>
                    {!contextMenu.file?.isDirectory && <button onClick={() => contextMenu.file && handleDownload(contextMenu.file)} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-white hover:bg-white/10 rounded transition-all"><DownloadCloud size={12} /> DOWNLOAD</button>}
                    <button onClick={() => contextMenu.file && deleteFile(contextMenu.file)} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-red-500 hover:bg-red-500/10 rounded transition-all"><Trash2 size={12} /> DELETE</button>
                </div>
            )}
        </div>
    );
}
