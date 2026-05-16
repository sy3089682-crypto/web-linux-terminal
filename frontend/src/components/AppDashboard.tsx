import { useState } from 'react';
import {
    Box, Search, Terminal, Globe, Database, Code,
    Shield, Monitor, Palette,
    Music, Video, Wifi,
    Download, Star
} from 'lucide-react';

interface AppSuggestion {
    name: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    category: string;
    description: string;
    command: string;
    color: string;
    popular: boolean;
}

const APPS: AppSuggestion[] = [
    // Development Tools
    { name: 'Node.js', icon: Code, category: 'Development', description: 'JavaScript runtime', command: 'apt install -y nodejs npm', color: 'text-green-500', popular: true },
    { name: 'Python 3', icon: Code, category: 'Development', description: 'Python programming language', command: 'apt install -y python3 python3-pip', color: 'text-blue-500', popular: true },
    { name: 'Docker', icon: Terminal, category: 'Development', description: 'Container runtime', command: 'apt install -y docker.io', color: 'text-blue-400', popular: true },
    { name: 'Git', icon: Code, category: 'Development', description: 'Version control', command: 'apt install -y git', color: 'text-orange-500', popular: true },
    { name: 'GCC/G++', icon: Code, category: 'Development', description: 'C/C++ compiler', command: 'apt install -y build-essential', color: 'text-purple-500', popular: false },
    { name: 'Rust', icon: Code, category: 'Development', description: 'Rust programming language', command: 'curl --proto =https --tlsv1.2 -sSf https://sh.rustup.rs | sh', color: 'text-orange-600', popular: false },
    { name: 'Go', icon: Code, category: 'Development', description: 'Go programming language', command: 'apt install -y golang', color: 'text-cyan-500', popular: false },
    { name: 'OpenJDK', icon: Code, category: 'Development', description: 'Java development kit', command: 'apt install -y default-jdk', color: 'text-red-500', popular: false },
    // Editors
    { name: 'Neovim', icon: Code, category: 'Editors', description: 'Modern terminal editor', command: 'apt install -y neovim', color: 'text-green-500', popular: true },
    { name: 'Vim', icon: Code, category: 'Editors', description: 'Classic terminal editor', command: 'apt install -y vim', color: 'text-green-600', popular: false },
    { name: 'Emacs', icon: Code, category: 'Editors', description: 'Extensible editor', command: 'apt install -y emacs', color: 'text-purple-600', popular: false },
    // Network
    { name: 'Nginx', icon: Globe, category: 'Network', description: 'Web server', command: 'apt install -y nginx', color: 'text-green-500', popular: true },
    { name: 'Apache', icon: Globe, category: 'Network', description: 'Web server', command: 'apt install -y apache2', color: 'text-orange-500', popular: false },
    { name: 'cURL', icon: Terminal, category: 'Network', description: 'HTTP client', command: 'apt install -y curl', color: 'text-blue-500', popular: true },
    { name: 'wget', icon: Download, category: 'Network', description: 'Download utility', command: 'apt install -y wget', color: 'text-blue-400', popular: true },
    { name: 'Netcat', icon: Wifi, category: 'Network', description: 'Network debugging', command: 'apt install -y netcat-openbsd', color: 'text-cyan-500', popular: false },
    // Database
    { name: 'PostgreSQL', icon: Database, category: 'Database', description: 'Relational database', command: 'apt install -y postgresql postgresql-contrib', color: 'text-blue-400', popular: true },
    { name: 'MySQL', icon: Database, category: 'Database', description: 'Relational database', command: 'apt install -y mysql-server', color: 'text-orange-500', popular: true },
    { name: 'MongoDB', icon: Database, category: 'Database', description: 'NoSQL database', command: 'apt install -y mongodb', color: 'text-green-500', popular: false },
    { name: 'Redis', icon: Database, category: 'Database', description: 'In-memory cache', command: 'apt install -y redis', color: 'text-red-500', popular: false },
    { name: 'SQLite', icon: Database, category: 'Database', description: 'Embedded database', command: 'apt install -y sqlite3', color: 'text-blue-300', popular: false },
    // System Tools
    { name: 'htop', icon: Monitor, category: 'System', description: 'Process monitor', command: 'apt install -y htop', color: 'text-cyan-500', popular: true },
    { name: 'neofetch', icon: Monitor, category: 'System', description: 'System info', command: 'apt install -y neofetch', color: 'text-purple-500', popular: true },
    { name: 'tmux', icon: Terminal, category: 'System', description: 'Terminal multiplexer', command: 'apt install -y tmux', color: 'text-green-500', popular: true },
    { name: 'screen', icon: Monitor, category: 'System', description: 'Terminal multiplexer', command: 'apt install -y screen', color: 'text-blue-500', popular: false },
    // Media
    { name: 'FFmpeg', icon: Video, category: 'Media', description: 'Video/audio processing', command: 'apt install -y ffmpeg', color: 'text-red-500', popular: true },
    { name: 'ImageMagick', icon: Palette, category: 'Media', description: 'Image processing', command: 'apt install -y imagemagick', color: 'text-purple-500', popular: false },
    { name: 'mpv', icon: Video, category: 'Media', description: 'Media player', command: 'apt install -y mpv', color: 'text-green-500', popular: false },
    { name: 'SoX', icon: Music, category: 'Media', description: 'Audio processing', command: 'apt install -y sox', color: 'text-blue-500', popular: false },
    // Security
    { name: 'OpenSSH', icon: Shield, category: 'Security', description: 'SSH server', command: 'apt install -y openssh-server', color: 'text-orange-500', popular: true },
    { name: 'Fail2Ban', icon: Shield, category: 'Security', description: 'Intrusion prevention', command: 'apt install -y fail2ban', color: 'text-red-500', popular: false },
    { name: 'Lynis', icon: Shield, category: 'Security', description: 'Security auditing', command: 'apt install -y lynis', color: 'text-cyan-500', popular: false },
    // Fun
    { name: 'cmatrix', icon: Terminal, category: 'Fun', description: 'Matrix rain effect', command: 'apt install -y cmatrix', color: 'text-green-500', popular: true },
    { name: 'sl', icon: Terminal, category: 'Fun', description: 'Steam locomotive', command: 'apt install -y sl', color: 'text-yellow-500', popular: false },
    { name: 'cowsay', icon: Terminal, category: 'Fun', description: 'ASCII art cow', command: 'apt install -y cowsay', color: 'text-pink-500', popular: true },
    { name: 'lolcat', icon: Palette, category: 'Fun', description: 'Rainbow text', command: 'apt install -y lolcat', color: 'text-purple-500', popular: true },
    { name: 'figlet', icon: Terminal, category: 'Fun', description: 'ASCII art text', command: 'apt install -y figlet', color: 'text-blue-500', popular: true },
];

const CATEGORIES = ['All', 'Development', 'Editors', 'Network', 'Database', 'System', 'Media', 'Security', 'Fun'];

export default function AppDashboard({ onRunCommand }: { onRunCommand: (cmd: string) => void }) {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [installing, setInstalling] = useState<string | null>(null);

    const filtered = APPS.filter(a => {
        if (category !== 'All' && a.category !== category) return false;
        if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.description.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const popular = APPS.filter(a => a.popular);
    const featured = category === 'All' && !search ? popular.slice(0, 8) : [];

    const handleInstall = (app: AppSuggestion) => {
        setInstalling(app.name);
        onRunCommand(`echo ">>> Installing ${app.name}..." && ${app.command} && echo ">>> ${app.name} installed successfully!"`);
        setTimeout(() => setInstalling(null), 2000);
    };

    return (
        <div className="h-full flex flex-col bg-[#0a0a0a]">
            {/* Search */}
            <div className="px-4 py-3 border-b border-white/5 bg-[#111]">
                <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search packages, tools, languages..."
                        className="w-full bg-black border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-[12px] focus:outline-none focus:border-blue-500 transition-all text-white placeholder-gray-700 font-medium"
                    />
                </div>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1.5 px-4 py-2.5 border-b border-white/5 overflow-x-auto no-scrollbar">
                {CATEGORIES.map(cat => (
                    <button key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${category === cat ? 'bg-blue-600/20 text-blue-500 border border-blue-500/30' : 'bg-white/5 text-gray-600 hover:text-gray-400 border border-transparent'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {/* Featured / Popular */}
                {featured.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Star size={12} className="text-yellow-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Popular</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {featured.map(app => (
                                <button key={app.name}
                                    onClick={() => handleInstall(app)}
                                    disabled={installing === app.name}
                                    className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-4 text-center transition-all group disabled:opacity-50"
                                >
                                    <app.icon size={24} className={`${app.color} mx-auto mb-2 group-hover:scale-110 transition-transform`} />
                                    <div className="text-[11px] font-bold text-white truncate">{app.name}</div>
                                    <div className="text-[9px] text-gray-700 truncate">{app.description}</div>
                                    {installing === app.name ? (
                                        <div className="mt-2 text-[9px] text-blue-500 font-black animate-pulse">INSTALLING...</div>
                                    ) : (
                                        <div className="mt-2 text-[9px] text-blue-500 font-black opacity-0 group-hover:opacity-100 transition-opacity">INSTALL</div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* All apps grid */}
                {filtered.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                        {filtered.map(app => (
                            <div key={app.name}
                                onClick={() => handleInstall(app)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-all group"
                            >
                                <app.icon size={16} className={`${app.color} shrink-0`} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold text-white truncate">{app.name}</div>
                                    <div className="text-[9px] text-gray-700 truncate">{app.description}</div>
                                </div>
                                <div className={`text-[8px] font-black uppercase tracking-widest ${installing === app.name ? 'text-blue-500 animate-pulse' : 'text-gray-800 group-hover:text-blue-500'} transition-all`}>
                                    {installing === app.name ? '...' : 'GET'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {filtered.length === 0 && (
                    <div className="text-center py-12">
                        <Box size={32} className="mx-auto mb-3 text-gray-800" />
                        <p className="text-sm font-bold text-gray-600">No packages found</p>
                        <p className="text-[10px] text-gray-800">Try a different search term</p>
                    </div>
                )}
            </div>
        </div>
    );
}
