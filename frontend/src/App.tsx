import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import './App.css';

function App() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize Terminal
    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#1e1e1e',
      },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;

    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.hostname}:3001`);

    socket.onopen = () => {
      term.writeln('Connected to Linux environment.');
    };

    socket.onmessage = (event) => {
      term.write(event.data);
    };

    socket.onerror = () => {
      term.writeln('\r\nError: WebSocket connection failed.');
    };

    socket.onclose = () => {
      term.writeln('\r\nDisconnected from Linux environment.');
    };

    // Handle user input
    term.onData((data) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(data);
      }
    });

    // Handle resizing
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      socket.close();
      term.dispose();
    };
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Cloud Linux Terminal</h1>
      </header>
      <div className="terminal-wrapper" ref={terminalRef}></div>
    </div>
  );
}

export default App;
