import { useState, useMemo } from 'react';
import { Clock, FileText, Plus, Edit3, Trash2, Undo, RefreshCw } from 'lucide-react';

interface Snapshot {
    id: string;
    timestamp: Date;
    file: string;
    action: 'create' | 'edit' | 'delete' | 'save';
    description: string;
    preview?: string;
}

export default function SessionTimeline() {
    const [snapshots] = useState<Snapshot[]>(() =>
        Array.from({ length: 12 }, (_, i) => ({
            id: `snap-${i}`,
            timestamp: new Date(Date.now() - (i * 3 + Math.random() * 2) * 60000),
            file: ['src/index.ts', 'src/App.tsx', 'package.json', 'src/styles.css', 'src/types.ts', 'README.md', '.env.example', 'src/components/Header.tsx', 'tailwind.config.js', 'vite.config.ts', 'src/services/api.ts', 'tsconfig.json'][i],
            action: (['create', 'edit', 'edit', 'save', 'edit', 'create', 'delete', 'edit', 'save', 'edit', 'create', 'edit'] as const)[i],
            description: ['Initial commit', 'Fixed type error', 'Added dark mode', 'Updated dependencies', 'Refactored auth', 'Added README', 'Removed unused import', 'Created Header component', 'Updated Tailwind config', 'Added Vite PWA', 'Created API service', 'Updated tsconfig'][i],
            preview: ['export function add(a, b) {', 'const x: string = 123; // error', 'background: #0a0a0a;', '"react": "^19.0.0"', 'interface User {', '# V-Cloud PC', '// deleted', 'function Header() {', 'theme: { extend: {} }', 'VitePWA({ registerType:', 'import axios from', '{ "compilerOptions":'][i],
        }))
    );

    const groupedByFile = useMemo(() => {
        const groups: Record<string, Snapshot[]> = {};
        snapshots.forEach(s => {
            if (!groups[s.file]) groups[s.file] = [];
            groups[s.file].push(s);
        });
        return groups;
    }, [snapshots]);

    const totalChanges = snapshots.length;

    const getActionColor = (action: string) => {
        switch (action) {
            case 'create': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'edit': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'delete': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'save': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
            default: return 'text-gray-500 bg-white/5 border-white/10';
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'create': return Plus; case 'edit': return Edit3;
            case 'delete': return Trash2; case 'save': return RefreshCw;
            default: return FileText;
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#0a0a0a]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/5 bg-[#111]">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-blue-500" />
                        <h2 className="text-sm font-black text-white">Session Timeline</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-600 font-mono">{totalChanges} changes</span>
                        <button className="p-1.5 rounded-lg hover:bg-white/5 text-gray-600 hover:text-blue-500">
                            <RefreshCw size={12} />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-[9px] text-gray-800">
                    <span className="w-2 h-2 rounded-full bg-green-500/50 animate-pulse" />
                    Auto-saving every 30s
                </div>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto p-4">
                {Object.entries(groupedByFile).map(([file, changes]) => (
                    <div key={file} className="mb-6">
                        <div className="flex items-center gap-2 mb-3 px-1">
                            <FileText size={12} className="text-gray-600" />
                            <span className="text-[10px] font-mono font-bold text-gray-400 truncate">{file}</span>
                            <span className="text-[9px] text-gray-800 ml-auto">{changes.length} versions</span>
                        </div>

                        <div className="relative ml-2">
                            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/5" />

                            {changes.map(snap => {
                                const Icon = getActionIcon(snap.action);
                                return (
                                    <div key={snap.id} className="relative pl-8 pb-4 last:pb-0">
                                        {/* Timeline dot */}
                                        <div className={`absolute left-0 top-1 w-[15px] h-[15px] rounded-full border-2 border-[#0a0a0a] flex items-center justify-center ${getActionColor(snap.action)}`}>
                                            <Icon size={7} />
                                        </div>

                                        <div className="bg-[#111] border border-white/5 rounded-xl p-3 hover:border-white/20 transition-all">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${getActionColor(snap.action)}`}>
                                                    {snap.action}
                                                </div>
                                                <span className="text-[9px] text-gray-700 font-mono">
                                                    {snap.timestamp.toLocaleTimeString()}
                                                </span>
                                            </div>

                                            <div className="text-[11px] font-medium text-white mb-1">{snap.description}</div>

                                            {snap.preview && (
                                                <div className="bg-black rounded-lg px-3 py-2 mt-2">
                                                    <code className="text-[10px] font-mono text-gray-500">
                                                        {snap.preview}
                                                    </code>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => {/* restore would go here */}}
                                                className="mt-2 flex items-center gap-1 text-[9px] font-black text-blue-500 hover:text-blue-400 transition-all opacity-0 hover:opacity-100"
                                            >
                                                <Undo size={10} /> RESTORE THIS VERSION
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {snapshots.length === 0 && (
                    <div className="text-center py-12">
                        <Clock size={32} className="mx-auto mb-3 text-gray-800" />
                        <p className="text-sm font-bold text-gray-600">No history yet</p>
                        <p className="text-[10px] text-gray-800">Changes will appear here as you work</p>
                    </div>
                )}
            </div>
        </div>
    );
}
