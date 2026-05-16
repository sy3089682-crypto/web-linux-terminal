import { useState, useEffect, useCallback } from 'react';
import {
    GitBranch, GitCommit,
    RefreshCw, FileCode, Plus, Minus,
    ArrowUp, ArrowDown,
    Circle, CheckCircle, AlertCircle
} from 'lucide-react';

interface GitLogEntry {
    hash: string;
    author: string;
    date: string;
    message: string;
    branch?: string;
}

interface GitStatusEntry {
    path: string;
    status: 'M' | 'A' | 'D' | 'R' | 'C' | 'U' | '?' | '!!';
}

interface GitBranch {
    name: string;
    current: boolean;
    remote?: string;
}

export default function GitClient({ onRunCommand }: { instanceId: string; onRunCommand: (cmd: string) => void }) {
    const [log] = useState<GitLogEntry[]>([]);
    const [status] = useState<GitStatusEntry[]>([]);
    const [branches] = useState<GitBranch[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeView, setActiveView] = useState<'status' | 'log' | 'branches'>('status');
    const [commitMsg, setCommitMsg] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            onRunCommand('git status --porcelain 2>&1');
            onRunCommand('git log --oneline --all -20 2>&1');
            onRunCommand('git branch -a 2>&1');
            setTimeout(() => setLoading(false), 1000);
        } catch {
            setLoading(false);
        }
    }, [onRunCommand]);

    useEffect(() => { fetchData(); }, []);

    const runGit = (cmd: string) => {
        onRunCommand(`git ${cmd}`);
        setTimeout(() => fetchData(), 500);
    };

    const getStatusIcon = (s: string) => {
        switch (s) {
            case 'M': return <FileCode size={12} className="text-yellow-500" />;
            case 'A': return <Plus size={12} className="text-green-500" />;
            case 'D': return <Minus size={12} className="text-red-500" />;
            case '?': case '!!': return <AlertCircle size={12} className="text-red-500" />;
            default: return <Circle size={12} className="text-gray-600" />;
        }
    };

    const getStatusLabel = (s: string) => {
        switch (s) {
            case 'M': return 'Modified'; case 'A': return 'Added';
            case 'D': return 'Deleted'; case '?': return 'Untracked';
            case '!!': return 'Ignored'; default: return s;
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#0a0a0a]">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#111]">
                <div className="flex items-center gap-1">
                    {(['status', 'log', 'branches'] as const).map(v => (
                        <button key={v}
                            onClick={() => setActiveView(v)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeView === v ? 'bg-orange-600/20 text-orange-500 border border-orange-500/30' : 'text-gray-600 hover:text-gray-400'}`}
                        >
                            {v === 'status' ? 'Changes' : v === 'log' ? 'History' : 'Branches'}
                        </button>
                    ))}
                </div>
                <button onClick={() => { onRunCommand('git fetch --all'); fetchData(); }}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-gray-600 hover:text-white">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeView === 'status' && (
                    <>
                        <div className="flex items-center gap-3 mb-4">
                            <input
                                type="text"
                                value={commitMsg}
                                onChange={(e) => setCommitMsg(e.target.value)}
                                placeholder="Commit message..."
                                className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2.5 text-[11px] focus:outline-none focus:border-orange-500 transition-all text-white placeholder-gray-700 font-medium"
                                onKeyDown={(e) => e.key === 'Enter' && commitMsg && runGit(`add -A && git commit -m "${commitMsg}"`)}
                            />
                            <button
                                onClick={() => commitMsg && runGit(`add -A && git commit -m "${commitMsg}"`)}
                                disabled={!commitMsg}
                                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-800 disabled:text-gray-600 rounded-xl text-[10px] font-black transition-all"
                            >
                                Commit
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {[
                                { label: 'Stage All', action: 'add -A', icon: Plus, color: 'text-green-500' },
                                { label: 'Push', action: 'push', icon: ArrowUp, color: 'text-blue-500' },
                                { label: 'Pull', action: 'pull', icon: ArrowDown, color: 'text-purple-500' },
                            ].map(btn => (
                                <button key={btn.label} onClick={() => runGit(btn.action)}
                                    className="flex flex-col items-center gap-1.5 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                                    <btn.icon size={16} className={btn.color} />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{btn.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-3">
                            {status.length} changed files
                        </div>

                        {status.map(f => (
                            <div key={f.path}
                                onClick={() => runGit(`diff ${f.path}`)}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 cursor-pointer transition-all text-xs"
                            >
                                {getStatusIcon(f.status)}
                                <span className="flex-1 truncate font-mono">{f.path}</span>
                                <span className="text-[9px] font-black text-gray-700 uppercase">{getStatusLabel(f.status)}</span>
                            </div>
                        ))}

                        {status.length === 0 && (
                            <div className="text-center py-12">
                                <CheckCircle size={32} className="mx-auto mb-3 text-green-500/30" />
                                <p className="text-sm font-bold text-gray-600">Clean working tree</p>
                                <p className="text-[10px] text-gray-800">No changes to commit</p>
                            </div>
                        )}
                    </>
                )}

                {activeView === 'log' && (
                    <>
                        <div className="flex items-center gap-2 mb-4">
                            <button onClick={() => runGit('log --oneline --graph --all -30')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg text-[10px] font-bold text-gray-500 hover:text-white transition-all">
                                <RefreshCw size={12} /> Refresh
                            </button>
                            <span className="text-[10px] text-gray-700 font-mono">Recent commits</span>
                        </div>

                        {log.length === 0 && (
                            <div className="text-center py-12">
                                <GitCommit size={32} className="mx-auto mb-3 text-gray-800" />
                                <p className="text-sm font-bold text-gray-600">No commits yet</p>
                            </div>
                        )}

                        {log.map((entry, i) => (
                            <div key={i} className="relative pl-6 pb-4 border-l border-white/5">
                                <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-orange-500 border-2 border-[#0a0a0a]" />
                                <div className="text-[10px] font-mono font-bold text-orange-500">{entry.hash}</div>
                                <div className="text-xs font-medium text-white mt-0.5">{entry.message}</div>
                                <div className="flex items-center gap-3 mt-1 text-[9px] text-gray-700">
                                    <span>{entry.author}</span>
                                    <span>{entry.date}</span>
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {activeView === 'branches' && (
                    <>
                        <div className="flex items-center gap-2 mb-4">
                            <button onClick={() => runGit('branch -a')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg text-[10px] font-bold text-gray-500 hover:text-white transition-all">
                                <RefreshCw size={12} /> Refresh
                            </button>
                        </div>

                        {branches.map((b, i) => (
                            <div key={i}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${b.current ? 'bg-orange-600/10 border border-orange-500/20' : 'hover:bg-white/5 border border-transparent'}`}
                            >
                                <GitBranch size={14} className={b.current ? 'text-orange-500' : 'text-gray-600'} />
                                <span className={`flex-1 font-mono font-bold ${b.current ? 'text-orange-500' : 'text-gray-400'}`}>
                                    {b.name} {b.current && '(current)'}
                                </span>
                                {b.remote && <span className="text-[9px] text-gray-700 font-mono">{b.remote}</span>}
                            </div>
                        ))}

                        {branches.length === 0 && (
                            <div className="text-center py-12">
                                <GitBranch size={32} className="mx-auto mb-3 text-gray-800" />
                                <p className="text-sm font-bold text-gray-600">No branches</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
