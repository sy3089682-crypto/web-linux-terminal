import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Terminal, Share2, Trash2, ExternalLink, Activity, HardDrive, Shield, Zap, Box, Code, Layout, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';

const TEMPLATES = [
    { id: 'blank', name: 'Blank OS', icon: Box, desc: 'Fresh Ubuntu installation' },
    { id: 'nodejs', name: 'Node.js API', icon: Zap, desc: 'Express.js boilerplate pre-injected' },
    { id: 'python', name: 'Python Flask', icon: Code, desc: 'Flask web app environment' },
    { id: 'react', name: 'React SPA', icon: Layout, desc: 'Vite-style React boilerplate' },
    { id: 'desktop', name: 'Cloud PC (VDI)', icon: Monitor, desc: 'Full Linux Desktop (LXDE) via WebVNC' },
];

export default function Dashboard() {
    const [instances, setInstances] = useState<any[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [name, setName] = useState('');
    const [image, setImage] = useState('ubuntu:latest');
    const [selectedTemplate, setSelectedTemplate] = useState('blank');
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const fetchInstances = async () => {
        try {
            const res = await axios.get('http://localhost:3001/api/instances');
            setInstances(res.data);
        } catch (err) {}
    };

    useEffect(() => { fetchInstances(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const finalImage = selectedTemplate === 'desktop' ? 'dorowu/ubuntu-desktop-lxde-vnc' : image;
            await axios.post('http://localhost:3001/api/instances', { name, image: finalImage, template: selectedTemplate });
            setShowCreate(false);
            setName('');
            fetchInstances();
        } catch (err) {}
    };

    const handleShare = async (id: string) => {
        try {
            const res = await axios.post(`http://localhost:3001/api/instances/${id}/share`);
            alert(`Share Link Created: ${res.data.url}`);
        } catch (err) {}
    };

    const handleDelete = async (id: string) => {
        try {
            await axios.delete(`http://localhost:3001/api/instances/${id}`);
            fetchInstances();
        } catch (err) {}
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans flex flex-col">
            <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#111]/80 backdrop-blur-xl sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                        <Terminal size={18} className="text-white" />
                    </div>
                    <span className="text-white font-black text-lg tracking-tighter uppercase">V-PLATFORM</span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-gray-500">
                        <Shield size={14} className="text-green-500" /> ENTERPRISE CLOUD
                    </div>
                    <button onClick={logout} className="text-sm font-bold hover:text-white transition-all bg-white/5 px-4 py-1.5 rounded-full">Sign Out</button>
                </div>
            </header>

            <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Active Workspaces</h1>
                        <p className="text-gray-500 font-medium">Manage and scale your high-performance compute instances</p>
                    </div>
                    <button 
                        onClick={() => setShowCreate(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-2xl shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95 group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform" /> Launch New Instance
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {instances.map(inst => (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={inst._id} 
                            className="bg-[#111] border border-white/5 rounded-3xl p-6 hover:border-blue-500/50 transition-all group shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] -z-10 group-hover:bg-blue-500/10 transition-all" />
                            
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-all">
                                    {inst.template === 'nodejs' ? '🚀' : inst.template === 'python' ? '🐍' : inst.template === 'react' ? '⚛️' : inst.template === 'desktop' ? '🖥️' : '🐧'}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${inst.status === 'running' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-gray-800 text-gray-400'}`}>
                                    {inst.status}
                                </div>
                            </div>
                            
                            <h3 className="text-white font-bold text-xl mb-1">{inst.name}</h3>
                            <p className="text-xs text-gray-500 font-mono mb-8 uppercase tracking-widest">{inst.image}</p>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <Activity size={14} className="text-blue-500 mb-2" />
                                    <div className="text-[10px] font-bold text-gray-500 uppercase">Compute</div>
                                    <div className="text-xs font-bold text-white">1 vCPU / 512MB</div>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <HardDrive size={14} className="text-purple-500 mb-2" />
                                    <div className="text-[10px] font-bold text-gray-500 uppercase">Storage</div>
                                    <div className="text-xs font-bold text-white">NVMe / Persistent</div>
                                </div>
                            </div>

                            {inst.slug && (
                                <a 
                                    href={`http://${inst.slug}.localhost:3001`} 
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mb-6 flex items-center justify-center gap-2 text-xs font-bold bg-white/5 text-gray-300 px-4 py-2 rounded-xl hover:bg-white/10 hover:text-white transition-all border border-white/5"
                                >
                                    <ExternalLink size={14} /> {inst.slug}.localhost:3001
                                </a>
                            )}

                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => navigate(`/terminal/${inst._id}`)}
                                    className="flex-1 bg-white text-black hover:bg-blue-600 hover:text-white py-2.5 rounded-xl font-black text-xs transition-all uppercase tracking-widest"
                                >
                                    Open IDE
                                </button>
                                <button 
                                    onClick={() => handleShare(inst._id)}
                                    className="p-2.5 bg-white/5 hover:bg-blue-600/10 hover:text-blue-500 rounded-xl transition-all border border-white/5"
                                    title="Share Session"
                                >
                                    <Share2 size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(inst._id)}
                                    className="p-2.5 bg-white/5 hover:bg-red-600/10 hover:text-red-500 rounded-xl transition-all border border-white/5"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>

            {/* Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-50">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#111] border border-white/5 rounded-[40px] p-10 w-full max-w-2xl shadow-[0_0_100px_-20px_rgba(59,130,246,0.3)]"
                    >
                        <h2 className="text-4xl font-black text-white mb-8 tracking-tighter uppercase">Launch Workspace</h2>
                        <form onSubmit={handleCreate} className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3">Project Name</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-600 transition-all font-bold text-white"
                                            placeholder="Apollo-11"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3">OS Kernel</label>
                                        <select 
                                            className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-600 transition-all font-bold text-white"
                                            value={image}
                                            onChange={(e) => setImage(e.target.value)}
                                        >
                                            <option value="ubuntu:latest">Ubuntu 22.04 LTS</option>
                                            <option value="alpine:latest">Alpine Linux</option>
                                            <option value="debian:latest">Debian Stable</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4">Start from Template</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {TEMPLATES.map(t => (
                                            <button 
                                                key={t.id}
                                                type="button"
                                                onClick={() => setSelectedTemplate(t.id)}
                                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${selectedTemplate === t.id ? 'bg-blue-600/10 border-blue-600' : 'bg-black border-white/5 hover:border-white/20'}`}
                                            >
                                                <div className={`p-2 rounded-lg ${selectedTemplate === t.id ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-500'}`}>
                                                    <t.icon size={18} />
                                                </div>
                                                <div>
                                                    <div className={`text-xs font-bold ${selectedTemplate === t.id ? 'text-white' : 'text-gray-400'}`}>{t.name}</div>
                                                    <div className="text-[10px] text-gray-600">{t.desc}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 bg-white/5 hover:bg-white/10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Cancel</button>
                                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20">Launch Empire</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
