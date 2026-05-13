const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const Docker = require('dockerode');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const docker = new Docker();

app.use(express.json());

// Simple Auth Middleware (Mock for now, ready for full DB)
const authenticate = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return null;
    }
};

wss.on('connection', async (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const image = url.searchParams.get('image') || 'ubuntu:latest';
    
    // In a "billion dollar" app, we'd verify the token here
    // For the prototype phase, we'll allow connection but log it
    console.log(`Client connecting with image: ${image}`);

    try {
        // Ensure image is available
        const images = await docker.listImages();
        if (!images.some(img => img.RepoTags?.includes(image))) {
            console.log(`Pulling image ${image}...`);
            await docker.pull(image);
        }

        const container = await docker.createContainer({
            Image: image,
            Cmd: ['/bin/bash'],
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            OpenStdin: true,
            StdinOnce: false,
            HostConfig: {
                Memory: 512 * 1024 * 1024, // 512MB limit
                NanoCpus: 1000000000,      // 1 CPU limit
                Binds: [
                    // Persistent storage would go here: `/host/path:/container/path`
                ]
            }
        });

        await container.start();

        const stream = await container.attach({
            stream: true,
            stdin: true,
            stdout: true,
            stderr: true
        });

        stream.on('data', (chunk) => ws.send(chunk.toString()));
        ws.on('message', (msg) => stream.write(msg));

        ws.on('close', async () => {
            console.log('Cleaning up container...');
            try {
                await container.stop();
                await container.remove();
            } catch (e) {}
        });

        // Handle terminal resize (Billion dollar feature: responsive shells)
        ws.on('message', (msg) => {
            try {
                const data = JSON.parse(msg);
                if (data.type === 'resize') {
                    container.resize({ h: data.rows, w: data.cols });
                }
            } catch (e) {
                // Not a JSON message, handle as terminal input
                stream.write(msg);
            }
        });

    } catch (err) {
        console.error('Docker error:', err);
        ws.send('\r\nError: Failed to launch environment.\r\n');
        ws.close();
    }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Billion Dollar Terminal Backend running on port ${PORT}`);
});
