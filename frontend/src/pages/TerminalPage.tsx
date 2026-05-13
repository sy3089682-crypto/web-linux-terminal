import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Terminal as TermIcon, Shield } from 'lucide-react';
import '@xterm/xterm/css/xterm.css';

export default function TerminalPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);

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
        fitAddon.fit();
        xtermRef.current = term;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const socket = new WebSocket(`${protocol}//${window.location.hostname}:3001?token=${token}&instanceId=${id}`);

        socket.onopen = () => {
            term.writeln('\x1b[1;32m●\x1b[0m Connected to Secure Instance');
            socket.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
        };

        socket.onmessage = (event) => term.write(event.data);
        socket.onclose = () => term.writeln('\r\n\x1b[1;31m○\x1b[0m Disconnected');

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
        <div className="h-screen w-screen bg-[#0a0a0a] flex flex-col">
            <header className="h-14 border-b border-gray-800 flex items-center justify-between px-6 bg-[#111]">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-1 hover:bg-white/5 rounded transition-all text-gray-400 hover:text-white">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <TermIcon size={16} className="text-blue-500" />
                        <span className="text-sm font-bold text-white uppercase tracking-widest">Instance Shell</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-green-500 font-bold bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                    <Shield size={12} /> SECURE SESSION
                </div>
            </header>
            <div className="flex-1 p-4 overflow-hidden">
                <div className="w-full h-full bg-black rounded-xl border border-gray-800 overflow-hidden relative">
                    <div className="w-full h-full pt-2" ref={terminalRef}></div>
                </div>
            </div>
        </div>
    );
}
