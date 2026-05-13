const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Instance = require('../models/Instance');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// Template boilerplates
const TEMPLATES = {
    nodejs: {
        'package.json': JSON.stringify({ name: 'app', version: '1.0.0', main: 'index.js', dependencies: { express: 'latest' } }, null, 2),
        'index.js': 'const express = require("express");\nconst app = express();\napp.get("/", (req, res) => res.send("V-Platform: Node.js Template Active!"));\napp.listen(8080, () => console.log("Server running on port 8080"));'
    },
    python: {
        'app.py': 'from flask import Flask\napp = Flask(__name__)\n@app.route("/")\ndef hello():\n    return "V-Platform: Python Template Active!"\nif __name__ == "__main__":\n    app.run(host="0.0.0.0", port=8080)',
        'requirements.txt': 'flask'
    },
    react: {
        'src/App.js': 'import React from "react";\nexport default function App() { return <h1>V-Platform: React Template Active!</h1>; }',
        'src/index.js': 'import React from "react";\nimport ReactDOM from "react-dom";\nimport App from "./App";\nReactDOM.render(<App />, document.getElementById("root"));',
        'public/index.html': '<!DOCTYPE html>\n<html>\n<head><title>React App</title></head>\n<body><div id="root"></div></body>\n</html>',
        'package.json': JSON.stringify({ name: 'react-app', version: '1.0.0', dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' } }, null, 2)
    }
};

router.get('/', auth, async (req, res) => {
    try {
        const instances = await Instance.find({ userId: req.user.id });
        res.json(instances);
    } catch (err) { res.status(500).send('Server Error'); }
});

router.post('/', auth, async (req, res) => {
    try {
        const { name, image, template = 'blank' } = req.body;
        const safeName = name.replace(/\s+/g, '_');
        const userVolPath = path.resolve(__dirname, '../../volumes', req.user.id, safeName);
        
        await fs.mkdir(userVolPath, { recursive: true });

        // Inject Template Files
        if (TEMPLATES[template]) {
            for (const [file, content] of Object.entries(TEMPLATES[template])) {
                const filePath = path.join(userVolPath, file);
                await fs.mkdir(path.dirname(filePath), { recursive: true });
                await fs.writeFile(filePath, content);
            }
        }

        const newInstance = new Instance({
            userId: req.user.id,
            name,
            image,
            template,
            status: 'stopped'
        });

        await newInstance.save();
        res.json(newInstance);
    } catch (err) { res.status(500).send('Server Error'); }
});

// Generate Share Link
router.post('/:id/share', auth, async (req, res) => {
    try {
        const token = crypto.randomBytes(16).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
        
        const instance = await Instance.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { $push: { sharedTokens: { token, expiresAt, access: 'read' } } },
            { new: true }
        );
        
        res.json({ token, url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/shared/${token}` });
    } catch (err) { res.status(500).send('Server Error'); }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const instance = await Instance.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!instance) return res.status(404).json({ msg: 'Instance not found' });
        res.json({ msg: 'Instance deleted' });
    } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;
