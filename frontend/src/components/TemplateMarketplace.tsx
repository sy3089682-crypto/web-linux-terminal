import { useState, useEffect } from 'react';
import { Search, Star, Download, Box, Code, Globe, Database, Shield, Monitor, Music, Sparkles, ChevronRight } from 'lucide-react';
import api from '../services/api';
import type { MarketTemplate } from '../types';

const CATEGORIES = ['All', 'Development', 'AI/ML', 'Database', 'Web', 'Mobile', 'DevOps', 'Security', 'Fun'];

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    'Development': Code, 'AI/ML': Sparkles, 'Database': Database, 'Web': Globe,
    'Mobile': Monitor, 'DevOps': Shield, 'Security': Shield, 'Fun': Music,
};

export default function TemplateMarketplace({ onRunCommand }: { onRunCommand: (cmd: string) => void }) {
    const [templates, setTemplates] = useState<MarketTemplate[]>([]);
    const [category, setCategory] = useState('All');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get('/api/templates', { params: { category: category === 'All' ? undefined : category, search: search || undefined } })
            .then(r => setTemplates(r.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [category, search]);

    const handleUse = async (t: MarketTemplate) => {
        try {
            await api.post(`/api/templates/${t._id}/download`);
            if (t.setupScript) onRunCommand(t.setupScript);
            onRunCommand(`echo ">>> ${t.name} template ready"`);
        } catch { /* ignore */ }
    };

    const filtered = templates;

    return (
        <div className="h-full flex flex-col bg-[#0a0a0a]">
            <div className="px-4 py-3 border-b border-white/5 bg-[#111]">
                <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search templates..."
                        className="w-full bg-black border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 text-white placeholder-gray-700" />
                </div>
            </div>

            <div className="flex gap-1.5 px-4 py-2.5 border-b border-white/5 overflow-x-auto no-scrollbar">
                {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${category === cat ? 'bg-blue-600/20 text-blue-500 border border-blue-500/30' : 'bg-white/5 text-gray-600 hover:text-gray-400 border border-transparent'}`}>
                        {cat}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="text-center py-12 text-gray-600 text-sm">Loading templates...</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12">
                        <Box size={32} className="mx-auto mb-3 text-gray-800" />
                        <p className="text-sm font-bold text-gray-600">No templates found</p>
                        <p className="text-[10px] text-gray-800">Be the first to create one!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filtered.map(t => {
                            const CatIcon = CATEGORY_ICONS[t.category] || Box;
                            return (
                                <div key={t._id} className="bg-[#111] border border-white/5 rounded-2xl p-4 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-[60px] rounded-full group-hover:bg-blue-500/10 transition-all pointer-events-none" />
                                    <div className="flex items-center gap-3 mb-3 relative z-10">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-xl flex items-center justify-center">
                                            <CatIcon size={18} className="text-blue-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-white truncate">{t.name}</div>
                                            <div className="text-[9px] text-gray-600">{t.authorName}{t.isOfficial ? ' · Official' : ''}</div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 leading-relaxed mb-3 line-clamp-2 relative z-10">{t.description}</p>
                                    <div className="flex items-center gap-3 text-[9px] text-gray-700 mb-3 relative z-10">
                                        <span className="flex items-center gap-1"><Download size={10} /> {t.downloads}</span>
                                        <span className="flex items-center gap-1"><Star size={10} /> {t.stars}</span>
                                        {t.tags?.slice(0, 2).map(tag => (
                                            <span key={tag} className="px-1.5 py-0.5 bg-white/5 rounded text-[8px] font-mono">{tag}</span>
                                        ))}
                                    </div>
                                    <button onClick={() => handleUse(t)}
                                        className="w-full flex items-center justify-center gap-1 py-2 bg-white/5 hover:bg-blue-600 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all relative z-10">
                                        Use Template <ChevronRight size={12} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
