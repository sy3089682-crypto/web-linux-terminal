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
const wss = new WebSocket.Server({ server });
const docker = new Docker();

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/webterminal')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/instances', require('./routes/instances'));

wss.on('connection', async (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const instanceId = url.searchParams.get('instanceId');

    if (!token || !instanceId) {
        ws.send('Error: Unauthorized or Missing Instance ID\r\n');
        return ws.close();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const instance = await Instance.findOne({ _id: instanceId, userId });
        if (!instance) {
            ws.send('Error: Instance not found\r\n');
            return ws.close();
        }

        // Pull image if needed
        const images = await docker.listImages();
        if (!images.some(img => img.RepoTags?.includes(instance.image))) {
            ws.send(`Pulling image ${instance.image}... Please wait.\r\n`);
            await docker.pull(instance.image);
        }

        // Persistent Volume Path
        const userVolPath = path.resolve(__dirname, '../volumes', userId, instance.name.replace(/\s+/g, '_'));

        const container = await docker.createContainer({
            Image: instance.image,
            Cmd: ['/bin/bash'],
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            OpenStdin: true,
            StdinOnce: false,
            WorkingDir: '/workspace',
            HostConfig: {
                Memory: 512 * 1024 * 1024,
                Binds: [`${userVolPath}:/workspace`],
                // Port mapping for web previews (dynamic allocation in production, static for prototype)
                PortBindings: { '8080/tcp': [{ HostPort: '0' }] } 
            }
        });

        await container.start();
        
        // Update instance status and container ID
        const containerData = await container.inspect();
        instance.containerId = containerData.Id;
        instance.status = 'running';
        // Get the dynamically allocated host port for 8080
        const hostPort = containerData.NetworkSettings.Ports['8080/tcp'][0].HostPort;
        instance.port = hostPort;
        await instance.save();

        const stream = await container.attach({
            stream: true,
            stdin: true,
            stdout: true,
            stderr: true
        });

        stream.on('data', (chunk) => ws.send(chunk.toString()));
        
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
            console.log(`Cleaning up container ${instance.name}...`);
            try {
                await container.stop();
                await container.remove();
                instance.status = 'stopped';
                instance.containerId = null;
                instance.port = null;
                await instance.save();
            } catch (e) {
                console.error('Cleanup error:', e);
            }
        });

    } catch (err) {
        console.error('Auth/Docker error:', err);
        ws.send('\r\nError: Failed to launch environment.\r\n');
        ws.close();
    }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Billion Dollar Terminal Backend running on port ${PORT}`);
});
