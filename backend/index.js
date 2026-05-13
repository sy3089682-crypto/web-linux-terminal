const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const Docker = require('dockerode');
const jwt = require('jsonwebtoken');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const Instance = require('./models/Instance');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });
const colWss = new WebSocket.Server({ noServer: true });
const docker = new Docker();
const { setupWSConnection } = require('y-websocket/bin/utils');
const passport = require('passport');

app.use(express.json());
app.use(passport.initialize());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/webterminal')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/instances', require('./routes/instances'));
app.use('/api/files', require('./routes/files'));
app.use('/api/ai', require('./routes/ai'));

server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathname = url.pathname;

    if (pathname === '/collaboration') {
        colWss.handleUpgrade(request, socket, head, (ws) => {
            colWss.emit('connection', ws, request);
        });
    } else {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    }
});

colWss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const room = url.searchParams.get('room') || 'default';
    setupWSConnection(ws, req, { docName: room });
});

// Map to track active connections per instance for collaboration
const instanceConnections = new Map();

wss.on('connection', async (ws, req) => {
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

        // Track connection
        if (!instanceConnections.has(instanceId)) instanceConnections.set(instanceId, new Set());
        instanceConnections.get(instanceId).add(ws);

        let container;
        if (instance.status === 'running' && instance.containerId) {
            container = docker.getContainer(instance.containerId);
        } else {
            const userVolPath = path.resolve(__dirname, '../volumes', instance.userId.toString(), instance.name.replace(/\s+/g, '_'));
            container = await docker.createContainer({
                Image: instance.image,
                Cmd: ['/bin/bash'],
                AttachStdin: true, AttachStdout: true, AttachStderr: true,
                Tty: true, OpenStdin: true, StdinOnce: false,
                WorkingDir: '/workspace',
                HostConfig: {
                    Memory: 512 * 1024 * 1024,
                    Binds: [`${userVolPath}:/workspace`],
                    PortBindings: { '8080/tcp': [{ HostPort: '0' }] } 
                }
            });
            await container.start();
            const data = await container.inspect();
            instance.containerId = data.Id;
            instance.status = 'running';
            instance.port = data.NetworkSettings.Ports['8080/tcp'][0].HostPort;
            await instance.save();
        }

        const stream = await container.attach({ stream: true, stdin: true, stdout: true, stderr: true });

        // Stats Streaming Engine
        const statsStream = await container.stats({ stream: true });
        statsStream.on('data', (chunk) => {
            const stats = JSON.parse(chunk.toString());
            const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
            const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
            const cpuPercent = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100.0;
            const memUsage = stats.memory_stats.usage;
            
            ws.send(JSON.stringify({
                type: 'stats',
                data: {
                    cpu: cpuPercent.toFixed(2),
                    memory: (memUsage / 1024 / 1024).toFixed(2),
                    timestamp: new Date().toLocaleTimeString()
                }
            }));
        });

        stream.on('data', (chunk) => {
            // Broadcast terminal output to all connected users (Collaboration)
            const clients = instanceConnections.get(instanceId);
            if (clients) {
                clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) client.send(chunk.toString());
                });
            }
        });
        
        ws.on('message', async (msg) => {
            try {
                const data = JSON.parse(msg);
                if (data.type === 'resize') {
                    container.resize({ h: data.rows, w: data.cols });
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
                        instance.status = 'stopped';
                        instance.containerId = null;
                        await instance.save();
                        instanceConnections.delete(instanceId);
                    } catch (e) {}
                }
            }
        });

    } catch (err) {
        ws.send('Error: Failed to launch environment.\r\n');
        ws.close();
    }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 Final Transcendence Engine on port ${PORT}`));
