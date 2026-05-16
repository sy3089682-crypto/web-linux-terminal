const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Instance = require('../models/Instance');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const slugify = require('slugify');

router.post('/import', auth, async (req, res) => {
    try {
        const { repoUrl, name, branch = 'main' } = req.body;
        if (!repoUrl) return res.status(400).json({ msg: 'Repository URL required' });

        const match = repoUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
        if (!match) return res.status(400).json({ msg: 'Invalid GitHub URL' });
        const [, owner, repo] = match;

        const instanceName = name || repo;
        const randomSuffix = crypto.randomBytes(3).toString('hex');
        const slug = `${slugify(instanceName, { lower: true, strict: true })}-${randomSuffix}`;
        const safeName = slug.replace(/\s+/g, '_');

        const userVolPath = path.resolve(__dirname, '../../volumes', req.user.id, safeName);
        await fs.mkdir(userVolPath, { recursive: true });

        const cloneCmd = `git clone --branch ${branch} --depth 1 https://github.com/${owner}/${repo}.git /workspace`;

        const newInstance = new Instance({
            userId: req.user.id,
            name: instanceName,
            image: 'ubuntu:latest',
            slug,
            template: 'blank',
            status: 'stopped'
        });
        await newInstance.save();

        res.json({ instance: newInstance, setupCommand: cloneCmd, msg: `Instance created. Run the setup command in terminal to clone ${owner}/${repo}.` });
    } catch (err) { res.status(500).json({ msg: err.message }); }
});

// OAuth token-based import (deeper integration)
router.get('/repos', auth, async (req, res) => {
    try {
        const user = require('../models/User').findById(req.user.id);
        const token = req.headers['x-github-token'];
        if (!token) return res.json({ repos: [], msg: 'No GitHub token. Authenticate with GitHub first.' });
        const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' }
        });
        if (!response.ok) return res.status(400).json({ msg: 'GitHub API error' });
        const repos = await response.json();
        res.json({ repos: repos.map(r => ({ name: r.name, owner: r.owner.login, url: r.html_url, description: r.description, language: r.language, stars: r.stargazers_count, fork: r.fork })) });
    } catch (err) { res.status(500).json({ msg: err.message }); }
});

module.exports = router;
