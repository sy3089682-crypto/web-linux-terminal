const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Instance = require('../models/Instance');
const Docker = require('dockerode');
const docker = new Docker();
const path = require('path');
const fs = require('fs');

// Get all instances for user
router.get('/', auth, async (req, res) => {
    try {
        const instances = await Instance.find({ userId: req.user.id });
        res.json(instances);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Create new instance
router.post('/', auth, async (req, res) => {
    try {
        const { name, image } = req.body;
        
        // Create persistent directory on host
        const userDir = path.join(__dirname, '../../volumes', req.user.id, name.replace(/\s+/g, '_'));
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }

        const newInstance = new Instance({
            userId: req.user.id,
            name,
            image,
            status: 'stopped'
        });

        await newInstance.save();
        res.json(newInstance);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Start/Stop instance (Logic integrated into WebSocket but keeping status update here)
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const instance = await Instance.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { status: req.body.status },
            { new: true }
        );
        res.json(instance);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Delete instance
router.delete('/:id', auth, async (req, res) => {
    try {
        const instance = await Instance.findOne({ _id: req.params.id, userId: req.user.id });
        if (!instance) return res.status(404).json({ msg: 'Instance not found' });
        
        // Cleanup Docker if running
        if (instance.containerId) {
            try {
                const container = docker.getContainer(instance.containerId);
                await container.stop();
                await container.remove();
            } catch (e) {}
        }

        await instance.remove();
        res.json({ msg: 'Instance deleted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
