import { useState, useRef, useEffect } from 'react';
import { Brain, Terminal, FileText, Send, Loader, Sparkles, Check, Play, Code } from 'lucide-react';
import api from '../services/api';
import type { AIAgentResponse } from '../types';

interface AIAgentProps {
    onRunCommand: (cmd: string) => void;
    onWriteFile?: (path: string, content: string) => void;
    context?: { cwd?: string; files?: { path: string; content: string }[] };
}

export default function AIAgent({ onRunCommand, onWriteFile, context }: AIAgentProps) {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'agent'; content: string; steps?: AIAgentResponse[] }[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [expandedStep, setExpandedStep] = useState<number | null>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isProcessing) return;
        const task = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: task }]);
        setIsProcessing(true);

        try {
            const res = await api.post('/api/ai/agent', { task, context: { ...context, commandHistory: [] } });
            const result: AIAgentResponse = res.data;
            setMessages(prev => [...prev, { role: 'agent', content: '', steps: result.steps || [result] }]);
            executeSteps(result.steps || [result]);
        } catch {
            setMessages(prev => [...prev, { role: 'agent', content: 'AI Agent unavailable. Try direct terminal mode.' }]);
        }
        setIsProcessing(false);
    };

    const executeSteps = async (steps: AIAgentResponse[]) => {
        for (const step of steps) {
            if (step.type === 'command' && step.cmd) {
                onRunCommand(step.cmd);
                await new Promise(r => setTimeout(r, 500));
            } else if (step.type === 'write' && step.path && step.content && onWriteFile) {
                onWriteFile(step.path, step.content);
            }
        }
    };

    const suggestions = [
        'Install Node.js and create an Express API',
        'Deploy this project to production',
        'Set up a PostgreSQL database',
        'Analyze the project structure',
        'Create a React component library',
    ];

    return (
        <div className="h-full flex flex-col bg-[#0a0a0a]">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-[#111]">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <Brain size={12} className="text-white" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">AI Agent</span>
                </div>
                <span className="text-[8px] text-gray-700 font-mono">Autonomous Mode</span>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                    <div className="text-center py-8">
                        <Sparkles size={32} className="mx-auto mb-3 text-purple-500/30" />
                        <p className="text-sm font-bold text-gray-600 mb-2">Neural AI Agent</p>
                        <p className="text-[9px] text-gray-800 leading-relaxed mb-6 max-w-sm mx-auto">
                            I can execute commands, create files, install packages, and deploy your projects.
                            Just tell me what you want to build.
                        </p>
                        <div className="space-y-1.5">
                            {suggestions.map((s, i) => (
                                <button key={i} onClick={() => { setInput(s); }}
                                    className="w-full text-left px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] text-gray-500 hover:text-gray-300 transition-all">
                                    <Sparkles size={10} className="inline mr-2 text-purple-500" />{s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i}>
                        {msg.role === 'user' ? (
                            <div className="flex gap-3 p-3 rounded-xl bg-blue-600/5 border border-blue-500/10">
                                <Play size={12} className="text-blue-500 mt-0.5 shrink-0" />
                                <div className="text-xs text-blue-400">{msg.content}</div>
                            </div>
                        ) : msg.steps ? (
                            <div className="space-y-1.5">
                                {msg.steps.map((step, j) => (
                                    <div key={j} className="rounded-xl overflow-hidden bg-purple-600/5 border border-purple-500/10">
                                        <button onClick={() => setExpandedStep(expandedStep === j ? null : j)}
                                            className="w-full flex items-center gap-2.5 p-2.5 text-xs transition-all hover:bg-white/5">
                                            {step.type === 'command' ? <Terminal size={12} className="text-blue-500 shrink-0" /> :
                                             step.type === 'write' ? <FileText size={12} className="text-amber-500 shrink-0" /> :
                                             step.type === 'response' ? <Sparkles size={12} className="text-purple-500 shrink-0" /> :
                                             <Code size={12} className="text-green-500 shrink-0" />}
                                            <span className="flex-1 font-mono text-[10px] text-gray-400 truncate">
                                                {step.cmd || step.path || step.text || step.type}
                                            </span>
                                            <Check size={10} className="text-emerald-500 shrink-0" />
                                        </button>
                                        {expandedStep === j && (
                                            <div className="px-3 pb-2.5 text-[9px] font-mono text-gray-600 bg-black/30">
                                                {JSON.stringify(step, null, 2)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-3 rounded-xl text-xs text-purple-400 bg-purple-600/5 border border-purple-500/10">
                                {msg.content}
                            </div>
                        )}
                    </div>
                ))}

                {isProcessing && (
                    <div className="flex items-center gap-2 text-xs text-purple-500 animate-pulse">
                        <Loader size={12} className="animate-spin" />
                        Processing...
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-white/5 bg-[#111]">
                <div className="relative">
                    <Brain size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-500" />
                    <input value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="Tell the AI Agent what to build..."
                        className="w-full bg-black border border-white/10 rounded-xl pl-9 pr-10 py-3 text-xs focus:outline-none focus:border-purple-600 transition-all text-white placeholder-gray-700" />
                    <button onClick={handleSend} disabled={isProcessing || !input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-purple-500 disabled:text-gray-800">
                        <Send size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
