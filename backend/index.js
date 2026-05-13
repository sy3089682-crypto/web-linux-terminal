const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const Docker = require('dockerode');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const docker = new Docker();

wss.on('connection', async (ws) => {
    console.log('Client connected');

    try {
        // Pull the image if it doesn't exist
        await docker.pull('ubuntu:latest');

        const container = await docker.createContainer({
            Image: 'ubuntu:latest',
            Cmd: ['/bin/bash'],
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            OpenStdin: true,
            StdinOnce: false
        });

        await container.start();

        const stream = await container.attach({
            stream: true,
            stdin: true,
            stdout: true,
            stderr: true
        });

        // Pipe Docker output to WebSocket
        stream.on('data', (chunk) => {
            ws.send(chunk.toString());
        });

        // Pipe WebSocket input to Docker
        ws.on('message', (message) => {
            stream.write(message);
        });

        ws.on('close', async () => {
            console.log('Client disconnected');
            try {
                await container.stop();
                await container.remove();
            } catch (err) {
                console.error('Error cleaning up container:', err);
            }
        });

        // Handle stream end
        stream.on('end', () => {
            ws.close();
        });

    } catch (err) {
        console.error('Docker error:', err);
        ws.send('Error: Could not start terminal environment.\r\n');
        ws.close();
    }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
});
