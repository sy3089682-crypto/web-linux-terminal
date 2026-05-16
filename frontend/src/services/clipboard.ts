// Sync clipboard between local browser and remote desktop
// Uses a dedicated WebSocket channel

let ws: WebSocket | null = null;
let listeners: ((text: string) => void)[] = [];

export function connectClipboard(instanceId: string, token: string) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_WS_URL || window.location.host;
    ws = new WebSocket(`${protocol}//${host}/clipboard?token=${token}&instanceId=${instanceId}`);

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'clipboard' && data.text) {
                listeners.forEach(fn => fn(data.text));
                navigator.clipboard?.writeText(data.text).catch(() => {});
            }
        } catch { /* ignore non-JSON messages */ }
    };
}

export function disconnectClipboard() {
    ws?.close();
    ws = null;
}

export function sendToClipboard(text: string) {
    if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'clipboard', text }));
    }
}

export function onClipboard(fn: (text: string) => void) {
    listeners.push(fn);
    return () => { listeners = listeners.filter(l => l !== fn); };
}

// Copy from local to remote on browser copy event
export function initClipboardSync(instanceId: string, token: string) {
    connectClipboard(instanceId, token);

    const handler = (e: ClipboardEvent) => {
        const text = e.clipboardData?.getData('text');
        if (text) sendToClipboard(text);
    };
    document.addEventListener('copy', handler);

    return () => {
        document.removeEventListener('copy', handler);
        disconnectClipboard();
    };
}
