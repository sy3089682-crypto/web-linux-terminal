import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import {
    Folder, File, ChevronRight, Upload, Trash2, Plus,
    Grid, List, Search, Home, ArrowLeft, RefreshCw, Terminal,
    FileText, Image, FileCode, Archive, Video, Music, FileSpreadsheet,
    Edit3
} from 'lucide-react';
import type { FileItem } from '../types';

interface FileManagerProps {
    instanceId: string;
    onOpenFile?: (file: FileItem) => void;
}

type ViewLayout = 'grid' | 'list';
type PanelMode = 'split' | 'single';

function getFileIcon(name: string, isDir: boolean) {
    if (isDir) return Folder;
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'js': case 'ts': case 'tsx': case 'jsx': case 'py': case 'rs': case 'go': case 'java': case 'c': case 'cpp': case 'html': case 'css': case 'json': return FileCode;
        case 'png': case 'jpg': case 'jpeg': case 'gif': case 'svg': case 'webp': case 'ico': return Image;
        case 'zip': case 'tar': case 'gz': case 'rar': case '7z': return Archive;
        case 'mp4': case 'webm': case 'avi': case 'mov': return Video;
        case 'mp3': case 'wav': case 'ogg': case 'flac': return Music;
        case 'csv': case 'xlsx': case 'xls': return FileSpreadsheet;
        case 'txt': case 'md': case 'log': return FileText;
        default: return File;
    }
}

export default function FileManager({ instanceId, onOpenFile }: FileManagerProps) {
    const [leftFiles, setLeftFiles] = useState<FileItem[]>([]);
    const [leftPath, setLeftPath] = useState('');
    const [rightFiles, setRightFiles] = useState<FileItem[]>([]);
    const [rightPath, setRightPath] = useState('');
    const [viewLayout, setViewLayout] = useState<ViewLayout>('list');
    const [panelMode, setPanelMode] = useState<PanelMode>('single');
    const [searchQuery, setSearchQuery] = useState('');
    const [dragging, setDragging] = useState(false);
    const [dragOver, setDragOver] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [uploading, setUploading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const [activePanel] = useState<'left' | 'right'>('left');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const h = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', h);
        return () => window.removeEventListener('resize', h);
    }, []);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { if (isMobile) setPanelMode('single'); }, [isMobile]);

    const currentFiles = activePanel === 'left' ? leftFiles : rightFiles;
    const currentPath = activePanel === 'left' ? leftPath : rightPath;

    const notify = (type: 'success' | 'error', msg: string) => {
        setNotification({ type, msg });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchFiles = useCallback(async (dir = '', panel?: 'left' | 'right') => {
        const p = panel || activePanel;
        try {
            const res = await api.get(`/api/files/list?instanceId=${instanceId}&dirPath=${dir}`);
            if (p === 'left') { setLeftFiles(res.data); setLeftPath(dir); }
            else { setRightFiles(res.data); setRightPath(dir); }
        } catch { notify('error', 'Failed to load files'); }
    }, [instanceId, activePanel]);

    // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
    useEffect(() => { fetchFiles('', 'left'); if (panelMode === 'split') fetchFiles('', 'right'); }, [instanceId, panelMode]);

    const navigateDir = (path: string, panel?: 'left' | 'right') => fetchFiles(path, panel);

    const goUp = () => {
        const parent = currentPath.split('/').slice(0, -1).join('/');
        fetchFiles(parent);
    };

    const goHome = () => fetchFiles('');

    const createFile = async () => {
        const name = prompt('File name:');
        if (!name) return;
        try {
            await api.post('/api/files/create', { instanceId, filePath: currentPath ? `${currentPath}/${name}` : name });
            fetchFiles(currentPath);
            notify('success', `Created ${name}`);
        } catch { notify('error', 'Failed to create file'); }
    };

    const mkdir = async () => {
        const name = prompt('Folder name:');
        if (!name) return;
        try {
            await api.post('/api/files/mkdir', { instanceId, dirPath: currentPath ? `${currentPath}/${name}` : name });
            fetchFiles(currentPath);
            notify('success', `Created folder ${name}`);
        } catch { notify('error', 'Failed to create folder'); }
    };

    const deleteItem = async (file: FileItem) => {
        if (!confirm(`Delete "${file.name}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/api/files/delete?instanceId=${instanceId}&filePath=${file.path}`);
            fetchFiles(currentPath);
            notify('success', `Deleted ${file.name}`);
        } catch { notify('error', 'Failed to delete'); }
    };

    const handleUpload = async (e: React.DragEvent | React.ChangeEvent<HTMLInputElement>) => {
        const files = 'dataTransfer' in e ? e.dataTransfer.files : e.target.files;
        if (!files || !files.length) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('instanceId', instanceId);
        formData.append('dirPath', currentPath);
        for (let i = 0; i < files.length; i++) formData.append('file', files[i]);
        try {
            await api.post('/api/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            fetchFiles(currentPath);
            notify('success', `Uploaded ${files.length} file(s)`);
        } catch { notify('error', 'Upload failed'); }
        setUploading(false);
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
    const handleDragLeave = () => setDragging(false);
    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); handleUpload(e); };

    const toggleSelect = (path: string) => {
        setSelectedFiles(prev => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });
    };

    const renameItem = async (file: FileItem) => {
        const name = prompt('New name:', file.name);
        if (!name || name === file.name) return;
        const oldPath = file.path;
        const parent = oldPath.split('/').slice(0, -1).join('/');
        const newPath = parent ? `${parent}/${name}` : name;
        try {
            await api.post('/api/files/rename', { instanceId, oldPath, newPath });
            fetchFiles(currentPath);
            notify('success', `Renamed to ${name}`);
        } catch { notify('error', 'Failed to rename'); }
    };

    const filteredFiles = searchQuery
        ? currentFiles.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : currentFiles;

    const renderFileItem = (file: FileItem) => {
        const Icon = getFileIcon(file.name, file.isDirectory);
        const isSelected = selectedFiles.has(file.path);
        const isDragOver = dragOver === file.path;

        return (
            <div
                key={file.path}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all
                    ${isSelected ? 'bg-blue-600/20 border border-blue-500/30' : 'hover:bg-white/5 border border-transparent'}
                    ${isDragOver ? 'border-blue-500 bg-blue-600/10' : ''}
                    ${viewLayout === 'grid' ? 'flex-col text-center p-4' : ''}`}
                onClick={() => { if (file.isDirectory) navigateDir(file.path); else toggleSelect(file.path); }}
                onDoubleClick={() => { if (!file.isDirectory && onOpenFile) onOpenFile(file); }}
                onContextMenu={(e) => { e.preventDefault(); }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(file.path); }}
                onDragLeave={() => setDragOver(null)}
            >
                <Icon size={viewLayout === 'grid' ? 32 : 20} className={file.isDirectory ? 'text-blue-500' : 'text-gray-500'} />
                <div className={viewLayout === 'grid' ? 'w-full truncate text-xs mt-1' : 'flex-1 min-w-0'}>
                    <div className="truncate text-sm font-medium text-white/90">{file.name}</div>
                    {viewLayout === 'list' && (
                        <div className="text-[10px] text-gray-600 font-mono">{file.isDirectory ? 'Directory' : 'File'}</div>
                    )}
                </div>
                {viewLayout === 'list' && file.isDirectory && <ChevronRight size={14} className="text-gray-600" />}
                {viewLayout === 'list' && !file.isDirectory && (
                    <div className="hidden group-hover:flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); renameItem(file); }} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white"><Edit3 size={12} /></button>
                        <button onClick={(e) => { e.stopPropagation(); deleteItem(file); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-500"><Trash2 size={12} /></button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div
            className="h-full flex flex-col bg-[#0a0a0a]"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Notification toast */}
            {notification && (
                <div className={`absolute top-4 right-4 z-50 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl transition-all ${notification.type === 'success' ? 'bg-green-600/90 text-white' : 'bg-red-600/90 text-white'}`}>
                    {notification.msg}
                </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#111]">
                <div className="flex items-center gap-1">
                    <button onClick={goHome} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"><Home size={14} /></button>
                    <button onClick={goUp} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"><ArrowLeft size={14} /></button>
                    <button onClick={() => fetchFiles(currentPath)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"><RefreshCw size={14} /></button>
                    {!isMobile && (
                        <button onClick={() => setPanelMode(p => p === 'split' ? 'single' : 'split')}
                            className={`p-1.5 rounded-lg ${panelMode === 'split' ? 'bg-blue-600/20 text-blue-500' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}>
                            <Terminal size={14} />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <div className="relative">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-32 bg-black border border-white/10 rounded-lg pl-7 pr-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <button onClick={() => setViewLayout(l => l === 'grid' ? 'list' : 'grid')}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                        {viewLayout === 'grid' ? <List size={14} /> : <Grid size={14} />}
                    </button>
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1 px-4 py-1.5 border-b border-white/5 bg-[#0d0d0d] overflow-x-auto no-scrollbar">
                <button onClick={goHome} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 whitespace-nowrap">/</button>
                {currentPath.split('/').filter(Boolean).map((part, i, arr) => (
                    <div key={i} className="flex items-center gap-1 whitespace-nowrap">
                        <span className="text-gray-700">/</span>
                        <button
                            onClick={() => fetchFiles(arr.slice(0, i + 1).join('/'))}
                            className="text-[10px] font-mono text-gray-400 hover:text-white transition-colors"
                        >
                            {part}
                        </button>
                    </div>
                ))}
            </div>

            {/* Upload overlay */}
            {dragging && (
                <div className="absolute inset-0 z-40 bg-blue-600/20 backdrop-blur-sm flex items-center justify-center border-2 border-dashed border-blue-500/50 m-2 rounded-2xl">
                    <div className="text-center">
                        <Upload size={48} className="mx-auto mb-4 text-blue-500 animate-bounce" />
                        <p className="text-white font-bold text-lg">Drop files anywhere</p>
                        <p className="text-gray-400 text-sm">to upload to {currentPath || '/'}</p>
                    </div>
                </div>
            )}

            {/* File panels */}
            <div className={`flex-1 flex ${panelMode === 'split' ? 'flex-row' : 'flex-col'} overflow-hidden`}>
                <div className={`flex-1 overflow-y-auto p-2 ${panelMode === 'split' ? 'border-r border-white/5' : ''}`}>
                    {/* Quick actions bar */}
                    <div className="flex items-center gap-1 mb-2 px-1">
                        <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" multiple />
                        <button onClick={createFile} className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-blue-600/20 rounded-lg text-[10px] font-bold text-gray-400 hover:text-blue-500 transition-all"><Plus size={12} /> File</button>
                        <button onClick={mkdir} className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-blue-600/20 rounded-lg text-[10px] font-bold text-gray-400 hover:text-blue-500 transition-all"><Folder size={12} /> Folder</button>
                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-blue-600/20 rounded-lg text-[10px] font-bold text-gray-400 hover:text-blue-500 transition-all"><Upload size={12} /> Upload</button>
                        {uploading && <span className="text-[10px] text-blue-500 ml-2 animate-pulse">Uploading...</span>}
                    </div>

                    {viewLayout === 'grid' ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {currentPath && (
                                <button onClick={goUp} className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-white/10 hover:border-blue-500/50 text-gray-500 hover:text-blue-500 transition-all">
                                    <ArrowLeft size={24} />
                                    <span className="text-[10px] mt-1">..</span>
                                </button>
                            )}
                            {filteredFiles.map(renderFileItem)}
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {currentPath && (
                                <button onClick={goUp} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-blue-500 transition-all text-sm">
                                    <ArrowLeft size={16} /> ..
                                </button>
                            )}
                            {filteredFiles.map(renderFileItem)}
                        </div>
                    )}

                    {filteredFiles.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-32 text-gray-700">
                            <Folder size={32} className="mb-2 opacity-30" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Empty directory</p>
                            <p className="text-[10px] text-gray-800 mt-1">Drop files here to upload</p>
                        </div>
                    )}
                </div>

                {/* Right panel (split mode) */}
                {panelMode === 'split' && (
                    <div className="flex-1 overflow-y-auto p-2">
                        <div className="flex items-center gap-1 mb-2 px-1">
                            <button onClick={() => fetchFiles(rightPath, 'right')} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400"><RefreshCw size={12} /></button>
                            <span className="text-[10px] font-mono text-gray-600 truncate">{rightPath || '/'}</span>
                        </div>
                        {rightPath && (
                            <button onClick={() => fetchFiles(rightPath.split('/').slice(0, -1).join('/'), 'right')} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-blue-500 hover:bg-white/5 rounded-lg transition-all">..</button>
                        )}
                        {rightFiles.map(f => (
                            <div key={f.path} className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/5 rounded-lg cursor-pointer"
                                onClick={() => { if (f.isDirectory) fetchFiles(f.path, 'right'); }}>
                                {f.isDirectory ? <Folder size={14} className="text-blue-500" /> : <File size={14} className="text-gray-500" />}
                                <span className="truncate">{f.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between px-4 py-1.5 border-t border-white/5 bg-[#111] text-[10px] text-gray-600 font-mono">
                <span>{currentFiles.length} items</span>
                <span className="truncate ml-2">{currentPath || '/'}</span>
            </div>
        </div>
    );
}
