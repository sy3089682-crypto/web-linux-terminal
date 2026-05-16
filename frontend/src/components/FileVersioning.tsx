import { useState, useEffect } from 'react';
import { Clock, FileText, RefreshCw, Undo, Plus, Edit3, Trash2, Save, Search } from 'lucide-react';
import api from '../services/api';
import type { Version } from '../types';

export default function FileVersioning({ instanceId, onRestore }: { instanceId: string; onRestore?: (content: string) => void }) {
    const [versions, setVersions] = useState<Version[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchFile, setSearchFile] = useState('');
    const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);

    const fetchVersions = async () => {
        setLoading(true);
        try {
            const params = searchFile ? `&filePath=${searchFile}` : '';
            const res = await api.get(`/api/versions/${instanceId}?${params}`);
            setVersions(res.data);
        } catch { /* ignore */ }
        setLoading(false);
    };

    useEffect(() => { fetchVersions(); }, [instanceId]);

    const handleRestore = async (v: Version) => {
        try {
            const res = await api.post(`/api/versions/${instanceId}/restore/${v._id}`);
            onRestore?.(res.data.content);
        } catch { /* ignore */ }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'create': return Plus; case 'edit': return Edit3;
            case 'delete': return Trash2; case 'save': return Save;
            default: return FileText;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'create': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'edit': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'delete': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'save': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
            default: return 'text-gray-500 bg-white/5 border-white/10';
        }
    };

    const grouped = versions.reduce((acc, v) => {
        if (!acc[v.filePath]) acc[v.filePath] = [];
        acc[v.filePath].push(v);
        return acc;
    }, {} as Record<string, Version[]>);

    return (
        <div className="h-full flex flex-col bg-[#0a0a0a]">
            <div className="px-4 py-3 border-b border-white/5 bg-[#111]">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-blue-500" />
                        <span className="text-xs font-black text-white">Version History</span>
                    </div>
                    <button onClick={fetchVersions} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-600">
                        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
                <div className="relative">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700" />
                    <input value={searchFile} onChange={e => { setSearchFile(e.target.value); setTimeout(fetchVersions, 300); }}
                        placeholder="Filter by file path..."
                        className="w-full bg-black border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-[10px] focus:outline-none focus:border-blue-500 text-white placeholder-gray-800" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {Object.entries(grouped).map(([filePath, fileVersions]) => (
                    <div key={filePath} className="mb-6">
                        <div className="flex items-center gap-2 mb-2 px-1">
                            <FileText size={12} className="text-gray-600" />
                            <span className="text-[10px] font-mono font-bold text-gray-400 truncate">{filePath}</span>
                            <span className="text-[9px] text-gray-800 ml-auto">{fileVersions.length} versions</span>
                        </div>
                        {fileVersions.slice(0, 20).map((v, i) => {
                            const Icon = getActionIcon(v.action);
                            return (
                                <div key={v._id}
                                    onClick={() => setSelectedVersion(selectedVersion?._id === v._id ? null : v)}
                                    className="relative pl-7 pb-3 cursor-pointer group">
                                    <div className={`absolute left-0 top-0.5 w-[15px] h-[15px] rounded-full border-2 border-[#0a0a0a] flex items-center justify-center ${getActionColor(v.action)}`}>
                                        <Icon size={7} />
                                    </div>
                                    {i < fileVersions.length - 1 && <div className="absolute left-[7px] top-4 bottom-0 w-px bg-white/5" />}
                                    <div className={`bg-[#111] border rounded-xl p-2.5 transition-all ${selectedVersion?._id === v._id ? 'border-blue-500/30 bg-blue-600/5' : 'border-white/5 hover:border-white/20'}`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[9px] font-mono text-gray-600">{new Date(v.createdAt).toLocaleTimeString()}</span>
                                            <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${getActionColor(v.action)}`}>{v.action}</span>
                                        </div>
                                        {v.description && <div className="text-[10px] text-gray-400">{v.description}</div>}
                                        <div className="text-[9px] text-gray-700 font-mono mt-1">{v.size} bytes · {v.hash?.slice(0, 8)}</div>
                                        {selectedVersion?._id === v._id && (
                                            <button onClick={() => handleRestore(v)}
                                                className="mt-2 flex items-center gap-1 text-[9px] font-black text-blue-500 hover:text-blue-400 transition-all">
                                                <Undo size={10} /> RESTORE THIS VERSION
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
                {versions.length === 0 && (
                    <div className="text-center py-12">
                        <Clock size={32} className="mx-auto mb-3 text-gray-800" />
                        <p className="text-sm font-bold text-gray-600">No versions saved yet</p>
                        <p className="text-[10px] text-gray-800">Changes are auto-saved as you work</p>
                    </div>
                )}
            </div>
        </div>
    );
}
