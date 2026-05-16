const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const Docker = require('dockerode');
const jwt = require('jsonwebtoken');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs');
const httpProxy = require('http-proxy');
require('dotenv').config();

const Instance = require('./models/Instance');

const app = express();
const server = http.createServer(app);

// Three separate WebSocket servers for different concerns
const terminalWss = new WebSocket.Server({ noServer: true });
const colWss = new WebSocket.Server({ noServer: true });
const clipboardWss = new WebSocket.Server({ noServer: true });
const statsWss = new WebSocket.Server({ noServer: true });

const DOCKER_SOCKET = process.env.DOCKER_SOCKET || '/var/run/docker.sock';
const docker = new Docker({ socketPath: DOCKER_SOCKET });
const { setupWSConnection } = require('y-websocket/bin/utils');
const passport = require('passport');

app.use(express.json({ limit: '10mb' }));
app.use(passport.initialize());

const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && CORS_ORIGIN !== '*') {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-auth-token');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

app.use('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/webterminal')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/instances', require('./routes/instances'));
app.use('/api/files', require('./routes/files'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/orgs', require('./routes/orgs'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/github', require('./routes/github'));
app.use('/api/versions', require('./routes/versions'));
app.use('/api/templates', require('./routes/templates'));

// WebSocket upgrade router
server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathname = url.pathname;

    switch (pathname) {
        case '/collaboration':
            colWss.handleUpgrade(request, socket, head, (ws) => {
                colWss.emit('connection', ws, request);
            });
            break;
        case '/clipboard':
            clipboardWss.handleUpgrade(request, socket, head, (ws) => {
                clipboardWss.emit('connection', ws, request);
            });
            break;
        case '/stats':
            statsWss.handleUpgrade(request, socket, head, (ws) => {
                statsWss.emit('connection', ws, request);
            });
            break;
        default:
            terminalWss.handleUpgrade(request, socket, head, (ws) => {
                terminalWss.emit('connection', ws, request);
            });
    }
});

colWss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const room = url.searchParams.get('room') || 'default';
    setupWSConnection(ws, req, { docName: room });
});

// Clipboard WebSocket - sync clipboard between users
clipboardWss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const instanceId = url.searchParams.get('instanceId');

    if (!token || !instanceId) {
        ws.close(4001, 'Unauthorized');
        return;
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET);
        ws.instanceId = instanceId;

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data);
                if (msg.type === 'clipboard' && msg.text) {
                    clipboardWss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN && client.instanceId === instanceId && client !== ws) {
                            client.send(JSON.stringify({ type: 'clipboard', text: msg.text }));
                        }
                    });
                }
            } catch (e) { /* ignore malformed messages */ }
        });
    } catch {
        ws.close(4001, 'Invalid token');
    }
});

// Stats WebSocket - dedicated channel for system metrics
statsWss.on('connection', async (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const instanceId = url.searchParams.get('instanceId');

    if (!token || !instanceId) {
        ws.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }));
        return ws.close();
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET);
        const instance = await Instance.findOne({ _id: instanceId });
        if (!instance || !instance.containerId) {
            ws.send(JSON.stringify({ type: 'error', message: 'No running instance' }));
            return ws.close();
        }

        const container = docker.getContainer(instance.containerId);
        const statsStream = await container.stats({ stream: true });

        ws.on('close', () => {
            try { statsStream.destroy(); } catch (e) { /* ignore */ }
        });

        statsStream.on('data', (chunk) => {
            if (ws.readyState !== WebSocket.OPEN) return;
            try {
                const stats = JSON.parse(chunk.toString());
                const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
                const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
                const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100.0 : 0;
                const memUsage = stats.memory_stats.usage || 0;
                const memLimit = stats.memory_stats.limit || 1;

                ws.send(JSON.stringify({
                    type: 'stats',
                    data: {
                        cpu: Math.min(cpuPercent.toFixed(2), 100),
                        memory: (memUsage / 1024 / 1024).toFixed(2),
                        memoryLimit: (memLimit / 1024 / 1024).toFixed(2),
                        timestamp: new Date().toLocaleTimeString(),
                        network: stats.networks ? Object.values(stats.networks).reduce((sum, n) => sum + n.rx_bytes, 0) : 0,
                    }
                }));
            } catch (e) { /* ignore parse errors */ }
        });

        statsStream.on('error', () => {
            try { statsStream.destroy(); } catch (e) { /* ignore */ }
        });
    } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Authentication failed' }));
        ws.close();
    }
});

// Terminal WebSocket - handles terminal I/O
const instanceConnections = new Map();

terminalWss.on('connection', async (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const instanceId = url.searchParams.get('instanceId');

    if (!token || !instanceId) {
        ws.send('Error: Unauthorized\r\n');
        return ws.close();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const instance = await Instance.findOne({ _id: instanceId });
        if (!instance) return ws.close();

        if (!instanceConnections.has(instanceId)) instanceConnections.set(instanceId, new Set());
        instanceConnections.get(instanceId).add(ws);

        let container;
        if (instance.status === 'running' && instance.containerId) {
            container = docker.getContainer(instance.containerId);
        } else {
            const userVolPath = path.resolve(__dirname, '../volumes', instance.userId.toString(), instance.name.replace(/\s+/g, '_'));
            fs.mkdirSync(userVolPath, { recursive: true });
            container = await docker.createContainer({
                Image: instance.image,
                Cmd: ['/bin/bash'],
                AttachStdin: true, AttachStdout: true, AttachStderr: true,
                Tty: true, OpenStdin: true, StdinOnce: false,
                WorkingDir: '/workspace',
                Env: ['TERM=xterm-256color', 'DEBIAN_FRONTEND=noninteractive'],
                HostConfig: {
                    Memory: 512 * 1024 * 1024,
                    Binds: [`${userVolPath}:/workspace`],
                    PortBindings: { '8080/tcp': [{ HostPort: '0' }], '80/tcp': [{ HostPort: '0' }] }
                }
            });
            await container.start();
            const data = await container.inspect();
            instance.containerId = data.Id;
            instance.status = 'running';
            const port80 = data.NetworkSettings.Ports['80/tcp'];
            const port8080 = data.NetworkSettings.Ports['8080/tcp'];
            instance.port = port80 ? port80[0].HostPort : (port8080 ? port8080[0].HostPort : null);
            await instance.save();
        }

        const stream = await container.attach({ stream: true, stdin: true, stdout: true, stderr: true });

        stream.on('data', (chunk) => {
            const clients = instanceConnections.get(instanceId);
            if (clients) {
                const text = chunk.toString();
                clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) client.send(text);
                });
            }
        });

        ws.on('message', async (msg) => {
            try {
                const data = JSON.parse(msg);
                if (data.type === 'resize') {
                    await container.resize({ h: data.rows, w: data.cols });
                } else {
                    stream.write(msg);
                }
            } catch (e) {
                stream.write(msg);
            }
        });

        ws.on('close', async () => {
            const clients = instanceConnections.get(instanceId);
            if (clients) {
                clients.delete(ws);
                if (clients.size === 0) {
                    console.log(`Final user left, cleaning up ${instance.name}...`);
                    try {
                        await container.stop();
                        await container.remove();
                    } catch (e) { /* ignore cleanup errors */ }
                    instance.status = 'stopped';
                    instance.containerId = null;
                    instance.port = null;
                    await instance.save();
                    instanceConnections.delete(instanceId);
                }
            }
        });

    } catch (err) {
        ws.send('Error: Failed to launch environment.\r\n');
        ws.close();
    }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`V-PLATFORM Engine running on port ${PORT}`));
