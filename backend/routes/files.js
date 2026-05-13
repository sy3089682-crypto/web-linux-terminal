const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const path = require('path');
const fs = require('fs').promises;
const Instance = require('../models/Instance');

// List files in a directory
router.get('/list', auth, async (req, res) => {
    try {
        const { instanceId, dirPath = '' } = req.query;
        const instance = await Instance.findOne({ _id: instanceId, userId: req.user.id });
        if (!instance) return res.status(404).json({ msg: 'Instance not found' });

        const userVolPath = path.resolve(__dirname, '../../volumes', req.user.id, instance.name.replace(/\s+/g, '_'), dirPath);
        
        const files = await fs.readdir(userVolPath, { withFileTypes: true });
        const result = files.map(file => ({
            name: file.name,
            isDirectory: file.isDirectory(),
            path: path.join(dirPath, file.name)
        }));

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Read file content
router.get('/read', auth, async (req, res) => {
    try {
        const { instanceId, filePath } = req.query;
        const instance = await Instance.findOne({ _id: instanceId, userId: req.user.id });
        if (!instance) return res.status(404).json({ msg: 'Instance not found' });

        const fullPath = path.resolve(__dirname, '../../volumes', req.user.id, instance.name.replace(/\s+/g, '_'), filePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        res.json({ content });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
