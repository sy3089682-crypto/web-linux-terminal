import { useState, useRef, useEffect } from 'react';
import { Terminal, Sparkles, Send, ArrowRight, Trash2, Code, User as UserIcon } from 'lucide-react';
import api from '../services/api';

interface AITerminalProps {
    onRunCommand: (cmd: string) => void;
}

interface HistoryItem {
    id: string;
    type: 'natural' | 'command' | 'result';
    content: string;
    timestamp: Date;
}

const naturalToBashExamples = [
    { natural: 'show me all files', bash: 'ls -la' },
    { natural: 'find large files', bash: 'find . -type f -size +100M' },
    { natural: 'check disk space', bash: 'df -h' },
    { natural: 'show running processes', bash: 'ps aux --sort=-%mem | head -20' },
    { natural: 'check network connections', bash: 'ss -tuln' },
    { natural: 'search in files', bash: 'grep -r "pattern" .' },
    { natural: 'compress this folder', bash: 'tar -czf archive.tar.gz ./' },
    { natural: 'monitor system', bash: 'htop' },
    { natural: 'check memory usage', bash: 'free -h' },
    { natural: 'count files by type', bash: 'find . -type f | awk -F. \'NF>1 {print $NF}\' | sort | uniq -c | sort -rn' },
];

export default function AITerminal({ onRunCommand }: AITerminalProps) {
    const [input, setInput] = useState('');
    const [mode, setMode] = useState<'ai' | 'direct'>('ai');
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [history, input]);

    const processNaturalLanguage = async (text: string) => {
        setIsProcessing(true);
        const userEntry: HistoryItem = { id: Date.now().toString(), type: 'natural', content: text, timestamp: new Date() };
        setHistory(prev => [...prev, userEntry]);

        // Simple pattern matching first (fast path)
        const lower = text.toLowerCase();
        let bashCmd = '';

        if (/^(ls|list|show)( files| directory| all)?/i.test(lower)) bashCmd = 'ls -la';
        else if (/^(find|search).*(large|big|size)/i.test(lower)) bashCmd = 'find . -type f -size +100M 2>/dev/null | head -20';
        else if (/(disk|storage|space|df)/i.test(lower)) bashCmd = 'df -h';
        else if (/process|ps|running/i.test(lower)) bashCmd = 'ps aux --sort=-%mem | head -20';
        else if (/network|netstat|connection|port/i.test(lower)) bashCmd = 'ss -tuln';
        else if (/memory|ram|free/i.test(lower)) bashCmd = 'free -h';
        else if (/cpu|load|top/i.test(lower)) bashCmd = 'top -b -n 1 | head -20';
        else if (/compress|tar|zip|archive/i.test(lower)) bashCmd = `tar -czf archive.tar.gz ./`;
        else if (/unzip|extract|decompress/i.test(lower)) bashCmd = 'tar -xzf ';
        else if (/docker.*(ps|container|running)/i.test(lower)) bashCmd = 'docker ps';
        else if (/docker.*image/i.test(lower)) bashCmd = 'docker images';
        else if (/git.*status/i.test(lower)) bashCmd = 'git status';
        else if (/git.*(log|history|commit)/i.test(lower)) bashCmd = 'git log --oneline --graph -20';
        else if (/git.*(branch|switch)/i.test(lower)) bashCmd = 'git branch -a';
        else if (/git.*diff/i.test(lower)) bashCmd = 'git diff';
        else if (/node.*version|node -v/i.test(lower)) bashCmd = 'node --version';
        else if (/npm.*(list|packages|installed)/i.test(lower)) bashCmd = 'npm list --depth=0';
        else if (/python.*version/i.test(lower)) bashCmd = 'python3 --version';
        else if (/whoami|user/i.test(lower)) bashCmd = 'whoami';
        else if (/date|time|clock/i.test(lower)) bashCmd = 'date';
        else if (/weather|curl/i.test(lower)) bashCmd = 'curl wttr.in';
        else if (/clear|clean/i.test(lower)) bashCmd = 'clear';
        else {
            // Try AI API if available
            try {
                const res = await api.post('/api/ai/ask', {
                    message: `Convert this to a bash command (return ONLY the command, no explanation): ${text}`,
                    fileContext: '',
                });
                if (res.data?.reply) {
                    const clean = res.data.reply.replace(/```bash\n?|```\n?/g, '').trim();
                    if (clean && clean.length < 500) bashCmd = clean;
                }
            } catch {
                // Fallback: use the text itself as command
                bashCmd = text;
            }
        }

        if (!bashCmd) bashCmd = text;

        const cmdEntry: HistoryItem = { id: (Date.now() + 1).toString(), type: 'command', content: bashCmd, timestamp: new Date() };
        setHistory(prev => [...prev, cmdEntry]);
        setIsProcessing(false);
        return bashCmd;
    };

    const handleSubmit = async () => {
        if (!input.trim()) return;
        if (mode === 'ai') {
            const bashCmd = await processNaturalLanguage(input);
            if (bashCmd && bashCmd !== 'clear') {
                onRunCommand(bashCmd);
            }
            // Clear terminal if requested
            if (bashCmd === 'clear' || /^clear/i.test(input)) {
                onRunCommand('clear');
            }
        } else {
            const entry: HistoryItem = { id: Date.now().toString(), type: 'command', content: input, timestamp: new Date() };
            setHistory(prev => [...prev, entry]);
            onRunCommand(input);
        }
        setInput('');
    };

    const showSuggestions = !input && mode === 'ai';

    return (
        <div className="h-full flex flex-col bg-[#0a0a0a]">
            {/* Mode toggle */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#111]">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setMode('ai')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${mode === 'ai' ? 'bg-purple-600/20 text-purple-500 border border-purple-500/30' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                        <Sparkles size={12} /> AI MODE
                    </button>
                    <button
                        onClick={() => setMode('direct')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${mode === 'direct' ? 'bg-blue-600/20 text-blue-500 border border-blue-500/30' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                        <Terminal size={12} /> DIRECT
                    </button>
                </div>
                <button onClick={() => setHistory([])} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-600 hover:text-gray-400">
                    <Trash2 size={12} />
                </button>
            </div>

            {/* History */}
            <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {history.length === 0 && mode === 'ai' && (
                    <div className="text-center py-8">
                        <Sparkles size={32} className="mx-auto mb-3 text-purple-500/30" />
                        <p className="text-sm font-bold text-gray-600 mb-1">AI Terminal</p>
                        <p className="text-[10px] text-gray-800 max-w-xs mx-auto leading-relaxed">
                            Type natural language to generate bash commands.<br />
                            Example: "show me all files" → ls -la
                        </p>
                    </div>
                )}
                {history.length === 0 && mode === 'direct' && (
                    <div className="text-center py-8">
                        <Terminal size={32} className="mx-auto mb-3 text-blue-500/30" />
                        <p className="text-sm font-bold text-gray-600 mb-1">Direct Terminal</p>
                        <p className="text-[10px] text-gray-800">Type bash commands directly</p>
                    </div>
                )}

                {history.map(item => (
                    <div key={item.id} className={`flex gap-3 ${item.type === 'natural' ? 'opacity-70' : ''}`}>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${item.type === 'natural' ? 'bg-purple-600/10' : item.type === 'command' ? 'bg-blue-600/10' : 'bg-green-600/10'}`}>
                            {item.type === 'natural' ? <UserIcon size={12} className="text-purple-500" /> :
                             item.type === 'command' ? <Terminal size={12} className="text-blue-500" /> :
                             <Code size={12} className="text-green-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className={`text-xs font-medium leading-relaxed ${item.type === 'natural' ? 'text-purple-400/80' : item.type === 'command' ? 'text-blue-400 font-mono' : 'text-green-400 font-mono'}`}>
                                {item.type === 'natural' ? `💬 ${item.content}` :
                                 item.type === 'command' ? `$ ${item.content}` :
                                 item.content}
                            </div>
                            <div className="text-[9px] text-gray-800 font-mono mt-0.5">
                                {item.timestamp.toLocaleTimeString()}
                            </div>
                        </div>
                        {item.type === 'command' && (
                            <button
                                onClick={() => onRunCommand(item.content)}
                                className="p-1.5 rounded-lg hover:bg-blue-600/10 text-gray-600 hover:text-blue-500 shrink-0 self-start"
                                title="Run this command"
                            >
                                <ArrowRight size={12} />
                            </button>
                        )}
                    </div>
                ))}

                {isProcessing && (
                    <div className="flex items-center gap-3 text-xs text-gray-600 animate-pulse">
                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                        Converting to bash...
                    </div>
                )}

                {/* Suggestions */}
                {showSuggestions && (
                    <div className="mt-4">
                        <div className="text-[9px] font-black uppercase tracking-widest text-gray-700 mb-2">Try asking:</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {naturalToBashExamples.slice(0, 6).map((ex, i) => (
                                <button
                                    key={i}
                                    onClick={() => setInput(ex.natural)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-500 hover:text-gray-300 transition-all text-left"
                                >
                                    <Sparkles size={10} className="text-purple-500 shrink-0" />
                                    <span className="truncate">{ex.natural}</span>
                                    <span className="text-[9px] text-gray-800 font-mono ml-auto shrink-0">{ex.bash}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/5 bg-[#111]">
                <div className="relative">
                    {mode === 'ai' && (
                        <Sparkles size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-500" />
                    )}
                    {mode === 'direct' && (
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-blue-500 font-bold">$</span>
                    )}
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        placeholder={mode === 'ai' ? 'Describe what you want to do...' : 'Enter bash command...'}
                        className="w-full bg-black border border-white/10 rounded-xl pl-9 pr-10 py-3 text-[12px] focus:outline-none focus:border-purple-600 transition-all font-mono text-white placeholder-gray-700"
                        spellCheck={false}
                    />
                    <button
                        onClick={handleSubmit}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-500 hover:text-purple-500 hover:bg-purple-500/10 transition-all"
                    >
                        <Send size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
