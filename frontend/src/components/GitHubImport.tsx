import { useState } from 'react';
import { GitBranch, Loader, Check, ChevronRight } from 'lucide-react';
import api from '../services/api';

export default function GitHubImport({ onImport }: { onImport: (instanceId: string) => void }) {
    const [repoUrl, setRepoUrl] = useState('');
    const [branch, setBranch] = useState('main');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ instance: { _id: string; name: string }; setupCommand: string } | null>(null);
    const [error, setError] = useState('');

    const handleImport = async () => {
        if (!repoUrl.trim()) return;
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const res = await api.post('/api/github/import', { repoUrl: repoUrl.trim(), name: name || undefined, branch });
            setResult(res.data);
        } catch (e: any) {
            setError(e.response?.data?.msg || 'Import failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#111] border border-white/5 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </div>
                <div>
                    <h3 className="text-sm font-black text-white">Import from GitHub</h3>
                    <p className="text-[10px] text-gray-600">Clone any public repository</p>
                </div>
            </div>

            {!result ? (
                <div className="space-y-4">
                    <input type="text" value={repoUrl} onChange={e => setRepoUrl(e.target.value)}
                        placeholder="https://github.com/owner/repo"
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all text-white placeholder-gray-700" />
                    <div className="flex gap-3">
                        <input type="text" value={name} onChange={e => setName(e.target.value)}
                            placeholder="Instance name (optional)"
                            className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all text-white placeholder-gray-700" />
                        <select value={branch} onChange={e => setBranch(e.target.value)}
                            className="bg-black border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                            <option value="main">main</option>
                            <option value="master">master</option>
                            <option value="develop">develop</option>
                        </select>
                    </div>
                    {error && <div className="text-red-500 text-xs">{error}</div>}
                    <button onClick={handleImport} disabled={loading || !repoUrl.trim()}
                        className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-blue-600 hover:text-white disabled:bg-gray-800 disabled:text-gray-600 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all">
                        {loading ? <Loader size={14} className="animate-spin" /> : <GitBranch size={14} />}
                        {loading ? 'Cloning...' : 'Import Repository'}
                    </button>
                </div>
            ) : (
                <div className="text-center">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                        <Check size={24} className="text-emerald-500" />
                    </div>
                    <h4 className="text-white font-bold mb-1">{result.instance.name}</h4>
                    <p className="text-[10px] text-gray-600 font-mono mb-4">Instance created successfully</p>
                    <div className="bg-black rounded-xl p-3 mb-4 text-left">
                        <div className="text-[10px] text-gray-700 font-mono mb-1">Run this in terminal:</div>
                        <code className="text-xs text-blue-500 font-mono break-all">{result.setupCommand}</code>
                    </div>
                    <button onClick={() => onImport(result.instance._id)}
                        className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all">
                        Open IDE <ChevronRight size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}
