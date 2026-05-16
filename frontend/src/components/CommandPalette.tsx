import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Terminal, Code, Folder, GitBranch, Search, Package,
    Settings, Monitor, BarChart3, FileText, Globe,
    Command, Trash2, Download, Share2,
    RefreshCw, GitCommit, HelpCircle
} from 'lucide-react';

interface Command {
    id: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    category: string;
    action: () => void;
    shortcut?: string;
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onSwitchTab: (tab: string) => void;
    onOpenFile: (path: string) => void;
    onRunCommand: (cmd: string) => void;
    onInstallPackage: (pkg: string) => void;
    files: { name: string; path: string }[];
}

type Mode = 'commands' | 'files' | 'git' | 'apps' | 'calc';

export default function CommandPalette({
    isOpen, onClose, onSwitchTab, onOpenFile, onRunCommand, onInstallPackage, files,
}: CommandPaletteProps) {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mode, setMode] = useState<Mode>('commands');
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        setQuery('');
        setSelectedIndex(0);
        setMode('commands');
        const el = inputRef.current;
        const timer = setTimeout(() => el?.focus(), 50);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/set-state-in-effect
    }, [isOpen]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                onClose();
            }
        };
        if (isOpen) window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    const commands: Command[] = useMemo(() => [
        { id: 'tab-terminal', label: 'Open Terminal', description: 'Switch to terminal tab', icon: Terminal, category: 'Navigation', action: () => onSwitchTab('terminal'), shortcut: '⌘1' },
        { id: 'tab-editor', label: 'Open Editor', description: 'Switch to code editor', icon: Code, category: 'Navigation', action: () => onSwitchTab('editor'), shortcut: '⌘2' },
        { id: 'tab-desktop', label: 'Open Desktop', description: 'View cloud desktop', icon: Monitor, category: 'Navigation', action: () => onSwitchTab('desktop'), shortcut: '⌘3' },
        { id: 'tab-files', label: 'Open Files', description: 'Browse workspace files', icon: Folder, category: 'Navigation', action: () => onSwitchTab('files'), shortcut: '⌘4' },
        { id: 'tab-stats', label: 'Open Stats', description: 'View system monitor', icon: BarChart3, category: 'Navigation', action: () => onSwitchTab('stats'), shortcut: '⌘5' },
        { id: 'tab-settings', label: 'Open Settings', description: 'Configure workspace', icon: Settings, category: 'Navigation', action: () => onSwitchTab('settings'), shortcut: '⌘6' },
        { id: 'cmd-git', label: 'Git Status', description: 'Show git repository status', icon: GitBranch, category: 'Git', action: () => onRunCommand('git status') },
        { id: 'cmd-git-log', label: 'Git Log', description: 'View commit history', icon: GitCommit, category: 'Git', action: () => onRunCommand('git log --oneline --graph --all -20') },
        { id: 'cmd-git-push', label: 'Git Push', description: 'Push commits to remote', icon: Globe, category: 'Git', action: () => onRunCommand('git push') },
        { id: 'cmd-git-pull', label: 'Git Pull', description: 'Pull latest from remote', icon: Download, category: 'Git', action: () => onRunCommand('git pull') },
        { id: 'cmd-install', label: 'Install Package', description: 'Install npm/apt/pip package', icon: Package, category: 'Apps', action: () => setMode('apps') },
        { id: 'cmd-update', label: 'Update System', description: 'Update all packages', icon: RefreshCw, category: 'Apps', action: () => onRunCommand('apt update && apt upgrade -y') },
        { id: 'cmd-clear', label: 'Clear Terminal', description: 'Clear terminal screen', icon: Trash2, category: 'System', action: () => onRunCommand('clear') },
        { id: 'cmd-reboot', label: 'Reboot Desktop', description: 'Restart VNC session', icon: RefreshCw, category: 'System', action: () => { onRunCommand('reboot'); window.location.reload(); } },
        { id: 'cmd-share', label: 'Share Session', description: 'Copy session link', icon: Share2, category: 'System', action: () => { navigator.clipboard.writeText(window.location.href); } },
        { id: 'cmd-help', label: 'Shortcuts', description: 'View keyboard shortcuts', icon: HelpCircle, category: 'System', action: () => setMode('commands') },
    ], [onSwitchTab, onRunCommand]);

    const filteredCommands = useMemo(() => {
        const q = query.toLowerCase().replace(/^>/, '').trim();
        if (!q) return commands;
        return commands.filter(c =>
            c.label.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q) ||
            c.category.toLowerCase().includes(q)
        );
    }, [query, commands]);

    const filteredFiles = useMemo(() => {
        const q = query.toLowerCase().replace(/^\./, '').trim();
        if (!q) return files.slice(0, 20);
        return files.filter(f => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)).slice(0, 20);
    }, [query, files]);

    const calculatorResult = useMemo(() => {
        if (!query.startsWith('=')) return null;
        try {
            const expr = query.slice(1).trim();
            const result = Function(`"use strict"; return (${expr})`)();
            return `= ${result}`;
        } catch { return null; }
    }, [query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') { onClose(); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, (mode === 'files' ? filteredFiles : filteredCommands).length - 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
        if (e.key === 'Enter') {
            e.preventDefault();
            if (calculatorResult) return;
            if (query.startsWith('>')) { onRunCommand(query.slice(1).trim()); onClose(); return; }
            if (query.startsWith('.')) {
                const f = filteredFiles[selectedIndex];
                if (f) { onOpenFile(f.path); onClose(); return; }
            }
            if (mode === 'apps') { onInstallPackage(query); onRunCommand(query); onClose(); return; }
            const cmd = filteredCommands[selectedIndex];
            if (cmd) { cmd.action(); onClose(); }
        }
        if (e.key === 'Tab') {
            e.preventDefault();
            if (query.startsWith('.')) setMode('files');
            else if (query.startsWith('>')) setMode('commands');
            else setMode(mode === 'commands' ? 'files' : 'commands');
        }
    };

    const modePrefix = query.startsWith('>') ? '>' : query.startsWith('.') ? '.' : query.startsWith('=') ? '=' : '';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -20 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                        className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
                    >
                        <div className="bg-[#151515] border border-white/10 rounded-2xl shadow-[0_0_100px_-20px_rgba(59,130,246,0.3)] overflow-hidden">
                            {/* Search input */}
                            <div className="flex items-center px-5 py-4 border-b border-white/5">
                                <Search size={16} className="text-gray-500 shrink-0" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                                    onKeyDown={handleKeyDown}
                                    placeholder={`${modePrefix === '>' ? 'Run command...' : modePrefix === '.' ? 'Search files...' : modePrefix === '=' ? 'Calculate...' : 'Search commands, files, git...'} ${modePrefix === '>' ? '(bash)' : modePrefix === '.' ? '(files)' : modePrefix === '=' ? '(math)' : ''}`}
                                    className="flex-1 bg-transparent border-0 outline-none text-sm text-white ml-3 placeholder-gray-600 font-medium"
                                    spellCheck={false}
                                />
                                <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-600">
                                    <kbd className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10">⌘K</kbd>
                                    <span className="text-gray-800">to close</span>
                                </div>
                            </div>

                            {/* Calculator result */}
                            {calculatorResult && (
                                <div className="px-5 py-4 bg-blue-600/5 border-b border-blue-500/20">
                                    <div className="text-lg font-mono font-bold text-blue-500">{calculatorResult}</div>
                                </div>
                            )}

                            {/* Results */}
                            <div ref={listRef} className="max-h-80 overflow-y-auto p-2" onWheel={() => {}}>
                                {query.startsWith('.') ? (
                                    /* File search results */
                                    filteredFiles.length > 0 ? (
                                        <>
                                            <div className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-600">Files</div>
                                            {filteredFiles.map((f, i) => (
                                                <button
                                                    key={f.path}
                                                    onClick={() => { onOpenFile(f.path); onClose(); }}
                                                    onMouseEnter={() => setSelectedIndex(i)}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${i === selectedIndex ? 'bg-blue-600/20 text-blue-500' : 'text-gray-400 hover:bg-white/5'}`}
                                                >
                                                    <FileText size={14} className="shrink-0" />
                                                    <span className="truncate">{f.name}</span>
                                                    <span className="text-[10px] text-gray-700 font-mono ml-auto truncate">{f.path}</span>
                                                </button>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="px-3 py-6 text-center text-[11px] text-gray-700 font-medium">No files found</div>
                                    )
                                ) : mode === 'apps' ? (
                                    /* App install mode */
                                    <div className="px-3 py-4">
                                        <div className="flex items-center gap-3 mb-4 text-sm text-gray-400">
                                            <Package size={16} className="text-blue-500" />
                                            Enter package name to install (npm, apt, pip):
                                        </div>
                                        {query && (
                                            <div className="space-y-1">
                                                {[
                                                    { name: query, desc: `Install "${query}" via apt`, cmd: `apt install -y ${query}` },
                                                    { name: query, desc: `Install "${query}" via npm`, cmd: `npm install -g ${query}` },
                                                    { name: query, desc: `Install "${query}" via pip`, cmd: `pip install ${query}` },
                                                ].map((pkg, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => { onRunCommand(pkg.cmd); onClose(); }}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-sm text-gray-400 transition-all"
                                                    >
                                                        <Package size={14} className="text-gray-600" />
                                                        <span>{pkg.desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Command results */
                                    filteredCommands.length > 0 ? (
                                        <>
                                            {['Navigation', 'Git', 'Apps', 'System'].map(cat => {
                                                const items = filteredCommands.filter(c => c.category === cat);
                                                if (!items.length) return null;
                                                return (
                                                    <div key={cat}>
                                                        <div className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-600">{cat}</div>
                                                        {items.map((cmd) => {
                                                            const globalIdx = filteredCommands.indexOf(cmd);
                                                            return (
                                                                <button
                                                                    key={cmd.id}
                                                                    onClick={() => { cmd.action(); onClose(); }}
                                                                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${globalIdx === selectedIndex ? 'bg-blue-600/20 text-blue-500' : 'text-gray-400 hover:bg-white/5'}`}
                                                                >
                                                                    <cmd.icon size={14} className="shrink-0 opacity-70" />
                                                                    <span className="truncate">{cmd.label}</span>
                                                                    <span className="text-[10px] text-gray-700 truncate hidden sm:block">{cmd.description}</span>
                                                                    {cmd.shortcut && (
                                                                        <kbd className="ml-auto text-[9px] font-black text-gray-700 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 shrink-0">
                                                                            {cmd.shortcut}
                                                                        </kbd>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })}
                                        </>
                                    ) : (
                                        <div className="px-3 py-6 text-center text-[11px] text-gray-700 font-medium">
                                            {query.startsWith('>')
                                                ? 'Press Enter to run command'
                                                : 'No results. Try > for bash, . for files, = for calculator'}
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Footer tips */}
                            <div className="flex items-center justify-between px-5 py-2.5 border-t border-white/5 bg-black/30">
                                <div className="flex items-center gap-4 text-[9px] text-gray-700 font-medium">
                                    <span className="flex items-center gap-1"><kbd className="bg-white/5 px-1 rounded text-[8px]">Tab</kbd> Switch mode</span>
                                    <span className="hidden sm:flex items-center gap-1"><kbd className="bg-white/5 px-1 rounded text-[8px]">↑↓</kbd> Navigate</span>
                                    <span className="flex items-center gap-1"><kbd className="bg-white/5 px-1 rounded text-[8px]">↵</kbd> Select</span>
                                </div>
                                <div className="flex items-center gap-2 text-[9px] text-gray-700">
                                    <span className="flex items-center gap-1"><Command size={10} /> {'>'} bash</span>
                                    <span className="flex items-center gap-1"><Command size={10} /> . file</span>
                                    <span className="flex items-center gap-1"><Command size={10} /> = calc</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
