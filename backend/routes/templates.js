const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Template = require('../models/Template');

router.get('/', async (req, res) => {
    try {
        const { category, search, sort = 'downloads' } = req.query;
        const filter = { isPublic: true };
        if (category && category !== 'All') filter.category = category;
        if (search) filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { tags: { $regex: search, $options: 'i' } }
        ];
        const sortOpt = sort === 'newest' ? { createdAt: -1 } : { downloads: -1 };
        const templates = await Template.find(filter).sort(sortOpt).limit(100);
        res.json(templates);
    } catch (err) { res.status(500).json({ msg: err.message }); }
});

router.get('/:id', async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) return res.status(404).json({ msg: 'Not found' });
        res.json(template);
    } catch (err) { res.status(500).json({ msg: err.message }); }
});

router.post('/', auth, async (req, res) => {
    try {
        const { name, slug, description, category, image, files, setupScript, tags, ports } = req.body;
        const template = new Template({
            name, slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
            description, category, image: image || 'ubuntu:latest',
            authorId: req.user.id, authorName: req.body.authorName || 'Anonymous',
            files, setupScript, tags, ports: ports || [8080]
        });
        await template.save();
        res.json(template);
    } catch (err) { res.status(500).json({ msg: err.message }); }
});

router.post('/:id/download', async (req, res) => {
    try {
        const template = await Template.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } }, { new: true });
        res.json(template);
    } catch (err) { res.status(500).json({ msg: err.message }); }
});

router.post('/:id/star', auth, async (req, res) => {
    try {
        const template = await Template.findByIdAndUpdate(req.params.id, { $inc: { stars: 1 } }, { new: true });
        res.json(template);
    } catch (err) { res.status(500).json({ msg: err.message }); }
});

module.exports = router;
