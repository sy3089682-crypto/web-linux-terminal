import { useRef, useState, useCallback, useEffect } from 'react';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, Monitor, Smartphone, Mouse, Keyboard } from 'lucide-react';

interface DesktopViewerProps {
    url: string;
    instanceSlug?: string;
}

type ViewMode = 'fit' | 'full' | 'mobile';
type Orientation = 'landscape' | 'portrait';

export default function DesktopViewer({ url, instanceSlug }: DesktopViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('fit');
    const [orientation, setOrientation] = useState<Orientation>('landscape');
    const [scale, setScale] = useState(1);
    const [showControls, setShowControls] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [touchMode, setTouchMode] = useState<'mouse' | 'touch'>('mouse');

    const zoomIn = useCallback(() => setScale(s => Math.min(s + 0.25, 3)), []);
    const zoomOut = useCallback(() => setScale(s => Math.max(s - 0.25, 0.25)), []);
    const resetZoom = useCallback(() => setScale(1), []);

    const toggleFullscreen = useCallback(async () => {
        if (!document.fullscreenElement) {
            await containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            await document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    const getViewportStyle = () => {
        const base = viewMode === 'mobile' ? (orientation === 'portrait' ? 375 : 667) : 1024;
        const baseHeight = viewMode === 'mobile' ? (orientation === 'portrait' ? 667 : 375) : 768;
        return {
            width: viewMode === 'full' ? '100%' : `${base}px`,
            height: viewMode === 'full' ? '100%' : `${baseHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            transition: 'transform 0.2s ease',
        };
    };

    useEffect(() => {
        const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFSChange);
        return () => document.removeEventListener('fullscreenchange', handleFSChange);
    }, []);

    const screenModes = [
        { id: 'fit' as ViewMode, icon: Monitor, label: 'Fit' },
        { id: 'full' as ViewMode, icon: Maximize2, label: 'Fill' },
        { id: 'mobile' as ViewMode, icon: Smartphone, label: 'Phone' },
    ];

    return (
        <div
            ref={containerRef}
            className="h-full w-full bg-black relative overflow-hidden group"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
        >
            {/* Control bar - auto hide */}
            <div className={`absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/80 to-transparent p-3 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {screenModes.map(m => (
                            <button
                                key={m.id}
                                onClick={() => setViewMode(m.id)}
                                className={`p-2 rounded-lg transition-all ${viewMode === m.id ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                                title={m.label}
                            >
                                <m.icon size={16} />
                            </button>
                        ))}
                        {viewMode === 'mobile' && (
                            <button
                                onClick={() => setOrientation(o => o === 'landscape' ? 'portrait' : 'landscape')}
                                className="p-2 rounded-lg bg-white/10 text-gray-400 hover:bg-white/20"
                                title="Rotate"
                            >
                                <RotateCcw size={16} />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setTouchMode(m => m === 'mouse' ? 'touch' : 'mouse')}
                            className={`p-2 rounded-lg transition-all ${touchMode === 'touch' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                            title={touchMode === 'mouse' ? 'Touch mode' : 'Mouse mode'}
                        >
                            {touchMode === 'mouse' ? <Mouse size={16} /> : <Keyboard size={16} />}
                        </button>
                        <span className="text-white/60 text-xs font-mono">{Math.round(scale * 100)}%</span>
                        <button onClick={zoomOut} className="p-1.5 rounded-lg bg-white/10 text-gray-400 hover:bg-white/20"><ZoomOut size={14} /></button>
                        <button onClick={resetZoom} className="p-1.5 rounded-lg bg-white/10 text-gray-400 hover:bg-white/20"><RotateCcw size={14} /></button>
                        <button onClick={zoomIn} className="p-1.5 rounded-lg bg-white/10 text-gray-400 hover:bg-white/20"><ZoomIn size={14} /></button>
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <button onClick={toggleFullscreen} className="p-2 rounded-lg bg-white/10 text-gray-400 hover:bg-white/20">
                            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* VNC Viewer Container */}
            <div className="h-full w-full flex items-center justify-center overflow-auto">
                <div
                    style={getViewportStyle()}
                    className={`relative bg-white rounded-sm shadow-2xl ${viewMode !== 'full' ? 'border border-white/10' : ''}`}
                >
                    <iframe
                        ref={iframeRef}
                        src={url}
                        className="w-full h-full border-0"
                        title={`Desktop - ${instanceSlug}`}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    />
                </div>
            </div>

            {/* Touch overlay hint */}
            {touchMode === 'touch' && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl text-white/80 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-white/10">
                    Touch mode — two fingers to scroll, pinch to zoom
                </div>
            )}
        </div>
    );
}
