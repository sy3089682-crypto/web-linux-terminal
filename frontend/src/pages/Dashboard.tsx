import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Terminal, Power, Trash2, ExternalLink, Activity, HardDrive, Shield } from 'lucide-react';

export default function Dashboard() {
    const [instances, setInstances] = useState<any[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [name, setName] = useState('');
    const [image, setImage] = useState('ubuntu:latest');
    const { user, logout, token } = useAuth();
    const navigate = useNavigate();

    const fetchInstances = async () => {
        try {
            const res = await axios.get('http://localhost:3001/api/instances');
            setInstances(res.data);
        } catch (err) {}
    };

    useEffect(() => {
        fetchInstances();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3001/api/instances', { name, image });
            setShowCreate(false);
            setName('');
            fetchInstances();
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
            {/* Nav */}
            <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-[#111]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                        <Terminal size={18} className="text-white" />
                    </div>
                    <span className="text-white font-bold text-lg">V-PLATFORM</span>
                </div>
                <div className="flex items-center gap-6">
                    <span className="text-sm font-medium text-gray-400">Welcome, <span className="text-white">{user?.username}</span></span>
                    <button onClick={logout} className="text-sm hover:text-white transition-all">Logout</button>
                </div>
            </header>

            <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">My Instances</h1>
                        <p className="text-gray-500">Manage your high-performance Linux cloud environments</p>
                    </div>
                    <button 
                        onClick={() => setShowCreate(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95"
                    >
                        <Plus size={20} /> Create Instance
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {instances.map(inst => (
                        <div key={inst._id} className="bg-[#111] border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all group shadow-xl">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-2xl group-hover:bg-blue-600/10 transition-all">
                                    {inst.image.includes('ubuntu') ? '🐧' : inst.image.includes('alpine') ? '🏔️' : '🌀'}
                                </div>
                                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${inst.status === 'running' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
                                    {inst.status}
                                </div>
                            </div>
                            
                            <h3 className="text-white font-bold text-lg mb-1">{inst.name}</h3>
                            <p className="text-xs text-gray-500 font-mono mb-6">{inst.image}</p>

                            <div className="space-y-3 mb-8">
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <Activity size={14} /> 512MB RAM / 1 vCPU
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <HardDrive size={14} /> Persistent Storage Enabled
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <Shield size={14} /> SSL Encryption
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => navigate(`/terminal/${inst._id}`)}
                                    className="flex-1 bg-white/5 hover:bg-blue-600 text-white py-2 rounded-lg font-bold text-sm transition-all"
                                >
                                    Open Terminal
                                </button>
                                <button 
                                    onClick={() => handleDelete(inst._id)}
                                    className="p-2 hover:bg-red-600/10 hover:text-red-500 rounded-lg transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {inst.port && (
                                <a 
                                    href={`http://localhost:${inst.port}`} 
                                    target="_blank"
                                    className="mt-4 flex items-center justify-center gap-2 text-xs text-blue-500 hover:text-blue-400 transition-all border-t border-gray-800 pt-4"
                                >
                                    <ExternalLink size={14} /> Web Preview (Port 8080)
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </main>

            {/* Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#111] border border-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-6">Launch New Instance</h2>
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Instance Name</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-600 transition-all"
                                    placeholder="e.g. Project Apollo"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Operating System</label>
                                <select 
                                    className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-600 transition-all"
                                    value={image}
                                    onChange={(e) => setImage(e.target.value)}
                                >
                                    <option value="ubuntu:latest">Ubuntu 22.04 LTS</option>
                                    <option value="alpine:latest">Alpine Linux (Lightweight)</option>
                                    <option value="debian:latest">Debian 12</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-lg font-bold">Cancel</button>
                                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold shadow-lg shadow-blue-600/20">Launch</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
