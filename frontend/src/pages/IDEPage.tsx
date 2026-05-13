import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
    ChevronLeft, Terminal as TermIcon, Shield, Folder, File, 
    RefreshCw, HardDrive, Cpu, Activity, Menu, X, Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchFiles = async (dir = '') => {
        try {
            const res = await axios.get(`http://localhost:3001/api/files/list?instanceId=${id}&dirPath=${dir}`);
            setFiles(res.data);
            setCurrentPath(dir);
        } catch (err) {}
    };

    useEffect(() => {
        fetchFiles();
    }, [id]);

    useEffect(() => {
        if (!terminalRef.current || !token || !id) return;

        const term = new Terminal({
            cursorBlink: true,
            fontFamily: '"Fira Code", monospace',
            fontSize: isMobile ? 12 : 14,
            theme: {
                background: '#0a0a0a',
                foreground: '#d4d4d4',
                cursor: '#f8f8f2',
            },
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        
        // Use a small timeout to ensure DOM is ready
        setTimeout(() => fitAddon.fit(), 100);
        
        xtermRef.current = term;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const socket = new WebSocket(`${protocol}//${window.location.hostname}:3001?token=${token}&instanceId=${id}`);

        socket.onopen = () => {
            term.writeln('\x1b[1;32m●\x1b[0m Secure Cloud Session Started');
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
    }, [id, token, isMobile]);

    return (
        <div className="h-screen w-screen bg-[#0a0a0a] flex flex-col overflow-hidden text-gray-300 font-sans">
            {/* Nav Bar */}
            <header className="h-14 bg-[#111] border-b border-white/5 flex items-center justify-between px-4 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/5 rounded-lg transition-all text-gray-400 hover:text-white">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                            <TermIcon size={14} className="text-white" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-white hidden sm:block">V-IDE</span>
                    </div>
                </div>

                <div className="flex items-center gap-6 text-[10px] font-bold">
                    <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                        <Shield size={12} /> SECURE
                    </div>
                    {!isMobile && (
                        <>
                            <div className="flex items-center gap-2 text-gray-400">
                                <Cpu size={14} /> 2.4GHz
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <Activity size={14} /> 12ms
                            </div>
                        </>
                    )}
                </div>

                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 hover:bg-white/5 rounded-lg text-gray-400"
                >
                    {isSidebarOpen ? <X size={20} /> : <Layout size={20} />}
                </button>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* File Explorer Sidebar */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.aside 
                            initial={{ x: -300 }}
                            animate={{ x: 0 }}
                            exit={{ x: -300 }}
                            className={`${isMobile ? 'absolute inset-0 z-40 bg-[#0a0a0a]' : 'w-72'} border-r border-white/5 flex flex-col`}
                        >
                            <div className="p-4 flex items-center justify-between border-b border-white/5 bg-[#111]/50">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Explorer</span>
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
                                            onClick={() => file.isDirectory && fetchFiles(file.path)}
                                            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-white/5 rounded transition-all group"
                                        >
                                            {file.isDirectory ? <Folder size={16} className="text-blue-500" /> : <File size={16} className="text-gray-500" />}
                                            <span className="truncate group-hover:text-white">{file.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 bg-[#111]/50 border-t border-white/5">
                                <div className="flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">
                                    <span>Usage</span>
                                    <span>42%</span>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 w-[42%]"></div>
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Terminal Area */}
                <main className="flex-1 flex flex-col relative bg-black">
                    <div className="flex-1 relative">
                        <div className="absolute inset-0" ref={terminalRef}></div>
                    </div>
                    
                    {/* Mobile Bottom Nav */}
                    {isMobile && !isSidebarOpen && (
                        <div className="h-12 border-t border-white/5 bg-[#111] flex items-center justify-around">
                            <button className="text-blue-500"><TermIcon size={20} /></button>
                            <button className="text-gray-500"><Folder size={20} /></button>
                            <button className="text-gray-500"><Activity size={20} /></button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
