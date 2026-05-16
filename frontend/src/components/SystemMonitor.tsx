import { useState, useEffect, useRef } from 'react';
import { Cpu, HardDrive, Activity, Wifi, RefreshCw, Clock, Thermometer } from 'lucide-react';

interface SysStat {
    cpu: string;
    memory: string;
    memoryLimit?: string;
    timestamp: string;
    network?: number;
}

export default function SystemMonitor({ instanceId, token }: { instanceId: string; token: string | null }) {
    const [stats, setStats] = useState<SysStat[]>([]);
    const [current, setCurrent] = useState<SysStat | null>(null);
    const [connected, setConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!token || !instanceId) return;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = import.meta.env.VITE_WS_URL || window.location.host;
        const ws = new WebSocket(`${protocol}//${wsHost}/stats?token=${token}&instanceId=${instanceId}`);
        wsRef.current = ws;

        ws.onopen = () => setConnected(true);
        ws.onclose = () => setConnected(false);
        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'stats') {
                    setCurrent(msg.data);
                    setStats(prev => [...prev.slice(-59), msg.data]);
                }
            } catch { /* ignore */ }
        };
        return () => ws.close();
    }, [token, instanceId]);

    const cpuPercent = current ? parseFloat(current.cpu) : 0;
    const memLimit = current?.memoryLimit ? parseFloat(current.memoryLimit) : 512;
    const memValue = current ? parseFloat(current.memory) : 0;
    const memPercent = (memValue / memLimit) * 100;
    const cpuColor = cpuPercent > 80 ? 'text-red-500' : cpuPercent > 50 ? 'text-yellow-500' : 'text-green-500';
    const memColor = memPercent > 80 ? 'text-red-500' : memPercent > 50 ? 'text-yellow-500' : 'text-green-500';

    return (
        <div className="h-full bg-[#0a0a0a] p-4 overflow-y-auto">
            <div className="flex items-center gap-2 mb-6">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    {connected ? 'Live Metrics' : 'Disconnected'}
                </span>
                <button onClick={() => window.location.reload()} className="ml-auto p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white">
                    <RefreshCw size={14} />
                </button>
            </div>

            <div className="bg-[#111] border border-white/5 rounded-2xl p-6 mb-4">
                <div className="flex items-center gap-3 mb-4">
                    <Cpu size={20} className="text-blue-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-gray-500">CPU</span>
                    <span className={`ml-auto text-2xl font-black ${cpuColor}`}>{current?.cpu || '0'}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${cpuColor.replace('text-', 'bg-')}`}
                        style={{ width: `${Math.min(cpuPercent, 100)}%` }} />
                </div>
            </div>

            <div className="bg-[#111] border border-white/5 rounded-2xl p-6 mb-4">
                <div className="flex items-center gap-3 mb-4">
                    <Activity size={20} className="text-purple-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-gray-500">Memory</span>
                    <span className={`ml-auto text-2xl font-black ${memColor}`}>{memValue.toFixed(0)} MB</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${memColor.replace('text-', 'bg-')}`}
                        style={{ width: `${Math.min(memPercent, 100)}%` }} />
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-gray-700 font-mono">
                    <span>0 MB</span>
                    <span>{memLimit.toFixed(0)} MB</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                    { icon: HardDrive, label: 'Storage', value: 'NVMe', sub: 'Persistent', color: 'text-emerald-500' },
                    { icon: Wifi, label: 'Network', value: connected ? 'Connected' : 'Offline', sub: instanceId.slice(0, 8), color: connected ? 'text-green-500' : 'text-red-500' },
                    { icon: Clock, label: 'Uptime', value: 'Live', sub: new Date().toLocaleTimeString(), color: 'text-blue-500' },
                    { icon: Thermometer, label: 'Instance', value: 'Linux', sub: 'Container', color: 'text-orange-500' },
                ].map((item, i) => (
                    <div key={i} className="bg-[#111] border border-white/5 rounded-xl p-4">
                        <item.icon size={16} className={`${item.color} mb-2`} />
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">{item.label}</div>
                        <div className="text-sm font-bold text-white truncate">{item.value}</div>
                        <div className="text-[10px] text-gray-700 font-mono">{item.sub}</div>
                    </div>
                ))}
            </div>

            {stats.length > 1 && (
                <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Activity (last 60s)</div>
                    <div className="flex items-end gap-0.5 h-12">
                        {stats.map((s, i) => {
                            const pct = Math.min(parseFloat(s.cpu) / 100 * 48, 48);
                            return <div key={i} className="flex-1 bg-blue-500/30 rounded-t" style={{ height: `${Math.max(pct, 2)}px` }} />;
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
