const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const path = require('path');
const fs = require('fs').promises;
const Instance = require('../models/Instance');
const multer = require('multer');

// Configure multer for memory storage, we'll write to the right volume manually
const upload = multer({ storage: multer.memoryStorage() });

// Helper to get absolute path
const getVolPath = async (instanceId, userId, subPath = '') => {
    const instance = await Instance.findOne({ _id: instanceId, userId });
    if (!instance) throw new Error('Instance not found');
    return path.resolve(__dirname, '../../volumes', userId.toString(), instance.name.replace(/\s+/g, '_'), subPath);
};

// List files in a directory
...
    try {
        const { instanceId, dirPath = '' } = req.query;
        const userVolPath = await getVolPath(instanceId, req.user.id, dirPath);
        
        const files = await fs.readdir(userVolPath, { withFileTypes: true });
        const result = files.map(file => ({
            name: file.name,
            isDirectory: file.isDirectory(),
            path: path.join(dirPath, file.name)
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// Read file content
router.get('/read', auth, async (req, res) => {
    try {
        const { instanceId, filePath } = req.query;
        const fullPath = await getVolPath(instanceId, req.user.id, filePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        res.json({ content });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// Save/Write file content
router.post('/save', auth, async (req, res) => {
    try {
        const { instanceId, filePath, content } = req.body;
        const fullPath = await getVolPath(instanceId, req.user.id, filePath);
        await fs.writeFile(fullPath, content, 'utf-8');
        res.json({ msg: 'File saved successfully' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// Delete file or directory
router.delete('/delete', auth, async (req, res) => {
    try {
        const { instanceId, filePath } = req.query;
        const fullPath = await getVolPath(instanceId, req.user.id, filePath);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
            await fs.rm(fullPath, { recursive: true, force: true });
        } else {
            await fs.unlink(fullPath);
        }
        res.json({ msg: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// Create directory
router.post('/mkdir', auth, async (req, res) => {
    try {
        const { instanceId, dirPath } = req.body;
        const fullPath = await getVolPath(instanceId, req.user.id, dirPath);
        await fs.mkdir(fullPath, { recursive: true });
        res.json({ msg: 'Directory created successfully' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// Create empty file
router.post('/create', auth, async (req, res) => {
    try {
        const { instanceId, filePath } = req.body;
        const fullPath = await getVolPath(instanceId, req.user.id, filePath);
        await fs.writeFile(fullPath, '', 'utf-8');
        res.json({ msg: 'File created successfully' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// Rename file or directory
router.post('/rename', auth, async (req, res) => {
    try {
        const { instanceId, oldPath, newPath } = req.body;
        const fullOldPath = await getVolPath(instanceId, req.user.id, oldPath);
        const fullNewPath = await getVolPath(instanceId, req.user.id, newPath);
        await fs.rename(fullOldPath, fullNewPath);
        res.json({ msg: 'Renamed successfully' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// Upload file
router.post('/upload', auth, upload.single('file'), async (req, res) => {
    try {
        const { instanceId, dirPath } = req.body;
        if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
        
        const fullPath = await getVolPath(instanceId, req.user.id, path.join(dirPath || '', req.file.originalname));
        await fs.writeFile(fullPath, req.file.buffer);
        res.json({ msg: 'File uploaded successfully' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// Download file
router.get('/download', auth, async (req, res) => {
    try {
        const { instanceId, filePath } = req.query;
        const fullPath = await getVolPath(instanceId, req.user.id, filePath);
        res.download(fullPath);
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

module.exports = router;
