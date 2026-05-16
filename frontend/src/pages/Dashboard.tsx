import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Terminal, Share2, Trash2, Activity, HardDrive, Shield, Zap, Box, Code, Layout, Monitor, Sparkles, Crown, GitBranch, Users, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Instance, Template } from '../types';

const TEMPLATES: Template[] = [
    { id: 'blank', name: 'Blank OS', icon: Box, desc: 'Fresh Ubuntu installation' },
    { id: 'nodejs', name: 'Node.js API', icon: Zap, desc: 'Express.js boilerplate pre-injected' },
    { id: 'python', name: 'Python Flask', icon: Code, desc: 'Flask web app environment' },
    { id: 'react', name: 'React SPA', icon: Layout, desc: 'Vite-style React boilerplate' },
    { id: 'desktop', name: 'Cloud PC (VDI)', icon: Monitor, desc: 'Full Linux Desktop (LXDE) via WebVNC' },
];

export default function Dashboard() {
    const [instances, setInstances] = useState<Instance[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [name, setName] = useState('');
    const [image, setImage] = useState('ubuntu:latest');
    const [selectedTemplate, setSelectedTemplate] = useState('blank');
    const auth = useAuth();
    const navigate = useNavigate();

    const fetchInstances = async () => {
        try {
            const res = await api.get('/api/instances');
            setInstances(res.data);
        } catch {}
    };

    useEffect(() => { fetchInstances(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const finalImage = selectedTemplate === 'desktop' ? 'dorowu/ubuntu-desktop-lxde-vnc' : image;
            await api.post('/api/instances', { name, image: finalImage, template: selectedTemplate });
            setShowCreate(false);
            setName('');
            fetchInstances();
        } catch {}
    };

    const handleShare = async (id: string) => {
        try {
            const res = await api.post(`/api/instances/${id}/share`);
            alert(`Share Link: ${res.data.url}`);
        } catch {}
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/api/instances/${id}`);
            fetchInstances();
        } catch {}
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans flex flex-col relative overflow-x-hidden">
            {/* Ambient Neural Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-blue-600/5 blur-[150px] rounded-full animate-pulse" style={{ animationDuration: '10s' }} />
                <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-purple-600/5 blur-[150px] rounded-full animate-pulse" style={{ animationDuration: '14s' }} />
            </div>

            <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 sm:px-8 bg-[#0d0d0d]/90 backdrop-blur-2xl sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Terminal size={18} className="text-white" />
                    </div>
                    <span className="text-white font-black text-lg tracking-tighter uppercase">V-PLATFORM</span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/billing')}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all text-[10px] font-bold">
                        <Crown size={12} className="text-yellow-500" /> Billing
                    </button>
                    <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-gray-600">
                        <Shield size={12} className="text-emerald-500" />
                        <span>NEURAL CLOUD</span>
                    </div>
                    <button onClick={() => auth?.logout()}
                        className="text-xs font-bold hover:text-white transition-all bg-white/5 px-4 py-1.5 rounded-full border border-white/5 hover:border-white/20">
                        Sign Out
                    </button>
                </div>
            </header>

            <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full relative z-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">Active Workspaces</h1>
                        <p className="text-sm text-gray-600 font-medium">Manage your cloud compute instances</p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-2xl shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span>Launch Instance</span>
                    </button>
                </div>

                {instances.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-3xl flex items-center justify-center mb-6 border border-white/5">
                            <Sparkles size={32} className="text-blue-500/50" />
                        </div>
                        <h2 className="text-xl font-black text-gray-500 mb-2">No Workspaces Yet</h2>
                        <p className="text-sm text-gray-800 mb-8 max-w-md">
                            Launch your first cloud instance and start building from anywhere.
                        </p>
                        <button onClick={() => setShowCreate(true)}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-3 rounded-2xl font-bold text-sm transition-all">
                            <Plus size={16} className="inline mr-2" />Create Your First Workspace
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {instances.map((inst, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={inst._id}
                            className="group relative bg-[#111]/80 backdrop-blur-sm border border-white/5 rounded-3xl p-6 hover:border-blue-500/30 transition-all duration-500"
                        >
                            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 blur-[80px] rounded-full group-hover:bg-blue-500/10 transition-all duration-700 pointer-events-none" />

                            <div className="flex justify-between items-start mb-5 relative z-10">
                                <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                    {inst.template === 'nodejs' ? '🚀' : inst.template === 'python' ? '🐍' : inst.template === 'react' ? '⚛️' : inst.template === 'desktop' ? '🖥️' : '🐧'}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${inst.status === 'running' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-gray-800 text-gray-500'}`}>
                                    <span className="flex items-center gap-1.5">
                                        {inst.status === 'running' && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />}
                                        {inst.status}
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-white font-bold text-lg mb-1 relative z-10">{inst.name}</h3>
                            <p className="text-[10px] text-gray-700 font-mono mb-6 uppercase tracking-widest relative z-10">{inst.image}</p>

                            <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                                <div className="bg-black/50 p-3 rounded-xl border border-white/5">
                                    <Activity size={14} className="text-blue-500 mb-1.5" />
                                    <div className="text-[9px] font-bold text-gray-600 uppercase">Compute</div>
                                    <div className="text-[11px] font-bold text-white">1 vCPU / 512MB</div>
                                </div>
                                <div className="bg-black/50 p-3 rounded-xl border border-white/5">
                                    <HardDrive size={14} className="text-purple-500 mb-1.5" />
                                    <div className="text-[9px] font-bold text-gray-600 uppercase">Storage</div>
                                    <div className="text-[11px] font-bold text-white">NVMe / Persistent</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 relative z-10">
                                <button
                                    onClick={() => navigate(`/terminal/${inst._id}`)}
                                    className="flex-1 bg-white text-black hover:bg-blue-600 hover:text-white py-2.5 rounded-xl font-black text-[10px] transition-all uppercase tracking-widest"
                                >
                                    Open IDE
                                </button>
                                <button onClick={() => handleShare(inst._id)}
                                    className="p-2.5 bg-white/5 hover:bg-blue-600/10 hover:text-blue-500 rounded-xl transition-all border border-white/5">
                                    <Share2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(inst._id)}
                                    className="p-2.5 bg-white/5 hover:bg-red-600/10 hover:text-red-500 rounded-xl transition-all border border-white/5">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Enterprise Quick Actions */}
                <div className="mt-12">
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-600 mb-4">Enterprise Tools</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { icon: Crown, label: 'Billing', desc: 'Manage plan & subscription', color: 'from-yellow-500 to-orange-600', onClick: () => navigate('/billing') },
                            { icon: GitBranch, label: 'Import Repo', desc: 'Clone from GitHub', color: 'from-gray-600 to-gray-800', onClick: () => setShowCreate(true) },
                            { icon: Users, label: 'Team', desc: 'Invite collaborators', color: 'from-blue-500 to-indigo-600', onClick: () => navigate('/billing') },
                            { icon: History, label: 'Version History', desc: 'Time-travel your files', color: 'from-purple-500 to-pink-600', onClick: () => navigate('/billing') },
                        ].map((item, i) => (
                            <button key={i} onClick={item.onClick}
                                className="bg-[#111] border border-white/5 rounded-2xl p-4 hover:border-blue-500/30 transition-all text-left group">
                                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg`}>
                                    <item.icon size={16} className="text-white" />
                                </div>
                                <div className="text-xs font-bold text-white mb-0.5">{item.label}</div>
                                <div className="text-[9px] text-gray-600">{item.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </main>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreate && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 z-50">
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.92, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-[#111] border border-white/5 rounded-[40px] p-6 sm:p-10 w-full max-w-2xl shadow-[0_0_100px_-20px_rgba(59,130,246,0.3)] relative overflow-hidden"
                        >
                            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

                            <h2 className="text-2xl sm:text-3xl font-black text-white mb-6 tracking-tighter uppercase relative z-10">
                                Launch Workspace
                            </h2>

                            <form onSubmit={handleCreate} className="space-y-8 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-[9px] font-black uppercase tracking-[0.15em] text-gray-500 mb-2.5">Project Name</label>
                                            <input type="text"
                                                className="w-full bg-black/80 border border-white/10 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-blue-600 transition-all font-bold text-white text-sm placeholder-gray-800"
                                                placeholder="my-project"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black uppercase tracking-[0.15em] text-gray-500 mb-2.5">OS Image</label>
                                            <select
                                                className="w-full bg-black/80 border border-white/10 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-blue-600 transition-all font-bold text-white text-sm"
                                                value={image}
                                                onChange={(e) => setImage(e.target.value)}>
                                                <option value="ubuntu:latest">Ubuntu 22.04 LTS</option>
                                                <option value="alpine:latest">Alpine Linux</option>
                                                <option value="debian:latest">Debian Stable</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[9px] font-black uppercase tracking-[0.15em] text-gray-500 mb-3">Template</label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {TEMPLATES.map(t => (
                                                <button key={t.id} type="button"
                                                    onClick={() => setSelectedTemplate(t.id)}
                                                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                                                        selectedTemplate === t.id
                                                            ? 'bg-blue-600/10 border-blue-600/50 shadow-lg shadow-blue-600/10'
                                                            : 'bg-black/50 border-white/5 hover:border-white/20'
                                                    }`}>
                                                    <div className={`p-2 rounded-xl ${selectedTemplate === t.id ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-500'}`}>
                                                        <t.icon size={16} />
                                                    </div>
                                                    <div>
                                                        <div className={`text-[11px] font-bold ${selectedTemplate === t.id ? 'text-white' : 'text-gray-400'}`}>{t.name}</div>
                                                        <div className="text-[9px] text-gray-700">{t.desc}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowCreate(false)}
                                        className="flex-1 bg-white/5 hover:bg-white/10 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/5">
                                        Cancel
                                    </button>
                                    <button type="submit"
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20">
                                        Launch
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
