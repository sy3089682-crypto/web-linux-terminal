import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Monitor, Cpu, HardDrive, Settings, Activity, Terminal as TermIcon, ShieldCheck } from 'lucide-react';
import '@xterm/xterm/css/xterm.css';
import './App.css';

const IMAGES = [
  { id: 'ubuntu:latest', name: 'Ubuntu 22.04', icon: '🐧' },
  { id: 'alpine:latest', name: 'Alpine Linux', icon: '🏔️' },
  { id: 'debian:latest', name: 'Debian Stable', icon: '🌀' },
];

function App() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const [selectedImage, setSelectedImage] = useState(IMAGES[0].id);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState({ cpu: '0%', mem: '0/512MB' });

  const connectTerminal = () => {
    if (!terminalRef.current) return;
    
    // Clear previous terminal
    if (xtermRef.current) {
        xtermRef.current.dispose();
    }

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
    const socket = new WebSocket(`${protocol}//${window.location.hostname}:3001?image=${selectedImage}`);

    socket.onopen = () => {
      setIsConnected(true);
      term.writeln('\x1b[1;32m●\x1b[0m Connected to Enterprise Linux Cloud');
      
      // Send initial size
      socket.send(JSON.stringify({
          type: 'resize',
          cols: term.cols,
          rows: term.rows
      }));
    };

    socket.onmessage = (event) => term.write(event.data);
    socket.onclose = () => {
        setIsConnected(false);
        term.writeln('\r\n\x1b[1;31m○\x1b[0m Session Terminated');
    };

    term.onData((data) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(data);
      }
    });

    window.addEventListener('resize', () => {
      fitAddon.fit();
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'resize',
            cols: term.cols,
            rows: term.rows
        }));
      }
    });
  };

  return (
    <div className="flex h-screen w-screen bg-[#0a0a0a] text-gray-300 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111] border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <TermIcon size={20} className="text-white" />
          </div>
          <h1 className="text-white font-bold tracking-tight">V-TERMINAL</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">Environments</div>
          {IMAGES.map(img => (
            <button 
              key={img.id}
              onClick={() => setSelectedImage(img.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all ${selectedImage === img.id ? 'bg-blue-600/10 text-blue-500 border border-blue-600/20' : 'hover:bg-white/5'}`}
            >
              <span>{img.icon}</span>
              <span className="text-sm font-medium">{img.name}</span>
            </button>
          ))}
          
          <div className="pt-8 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">Management</div>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 transition-all text-sm">
            <Activity size={18} /> Analytics
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 transition-all text-sm">
            <Settings size={18} /> Settings
          </button>
        </nav>

        <div className="p-4 mt-auto">
           <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
                <ShieldCheck size={14} className="text-green-500" /> Security: Enterprise
              </div>
              <div className="space-y-2">
                 <div className="flex justify-between text-xs">
                    <span>CPU</span>
                    <span className="text-blue-500">{isConnected ? '2.4%' : '0%'}</span>
                 </div>
                 <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: isConnected ? '15%' : '0%' }}></div>
                 </div>
                 <div className="flex justify-between text-xs pt-1">
                    <span>RAM</span>
                    <span className="text-purple-500">{isConnected ? '128MB' : '0MB'}</span>
                 </div>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-[#0a0a0a]/50 backdrop-blur-md">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm font-medium">
                 <Cpu size={16} className="text-gray-500" /> 
                 <span>Instance: <span className="text-white">v-node-01</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                 <HardDrive size={16} className="text-gray-500" /> 
                 <span>Volume: <span className="text-white">5GB SSD</span></span>
              </div>
           </div>

           <div className="flex items-center gap-4">
              {!isConnected ? (
                <button 
                  onClick={connectTerminal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                >
                  Launch Instance
                </button>
              ) : (
                <div className="flex items-center gap-2 text-xs font-medium bg-green-500/10 text-green-500 px-3 py-1.5 rounded-full border border-green-500/20">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                   RUNNING
                </div>
              )}
           </div>
        </header>

        <div className="flex-1 p-6 flex flex-col">
          <div className="flex-1 bg-black rounded-2xl border border-gray-800 overflow-hidden shadow-2xl relative">
             <div className="absolute top-0 left-0 right-0 h-8 bg-gray-900/30 border-b border-gray-800/50 flex items-center px-4 gap-2 z-10">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                <div className="ml-4 text-[10px] text-gray-500 font-mono uppercase tracking-widest">Interactive-Shell-v1.0</div>
             </div>
             <div className="w-full h-full pt-8" ref={terminalRef}></div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
