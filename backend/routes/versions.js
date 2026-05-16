const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Version = require('../models/Version');
const Instance = require('../models/Instance');
const crypto = require('crypto');

router.post('/save', auth, async (req, res) => {
    try {
        const { instanceId, filePath, content, description } = req.body;
        const instance = await Instance.findOne({ _id: instanceId, userId: req.user.id });
        if (!instance) return res.status(404).json({ msg: 'Instance not found' });
        const sub = require('../models/Subscription');
        const subscription = await sub.findOne({ userId: req.user.id, orgId: { $exists: false } });
        const maxVersions = subscription?.features?.versionHistory ? 1000 : 50;

        const hash = crypto.createHash('md5').update(content || '').digest('hex');
        const existing = await Version.findOne({ instanceId, filePath, hash });
        if (existing) return res.json({ msg: 'No changes', version: existing });

        const version = new Version({
            instanceId, userId: req.user.id, filePath,
            content, size: (content || '').length, hash,
            action: 'save', description
        });
        await version.save();

        const count = await Version.countDocuments({ instanceId });
        if (count > maxVersions) {
            const oldest = await Version.find({ instanceId }).sort({ createdAt: 1 }).limit(count - maxVersions);
            await Version.deleteMany({ _id: { $in: oldest.map(v => v._id) } });
        }
        res.json({ version, msg: 'Version saved' });
    } catch (err) { res.status(500).json({ msg: err.message }); }
});

router.get('/:instanceId', auth, async (req, res) => {
    try {
        const { filePath } = req.query;
        const filter = { instanceId: req.params.instanceId, userId: req.user.id };
        if (filePath) filter.filePath = filePath;
        const versions = await Version.find(filter).sort({ createdAt: -1 }).limit(200);
        res.json(versions);
    } catch (err) { res.status(500).json({ msg: err.message }); }
});

router.get('/:instanceId/:versionId', auth, async (req, res) => {
    try {
        const version = await Version.findOne({ _id: req.params.versionId, instanceId: req.params.instanceId, userId: req.user.id });
        if (!version) return res.status(404).json({ msg: 'Version not found' });
        res.json(version);
    } catch (err) { res.status(500).json({ msg: err.message }); }
});

router.post('/:instanceId/restore/:versionId', auth, async (req, res) => {
    try {
        const version = await Version.findOne({ _id: req.params.versionId, instanceId: req.params.instanceId, userId: req.user.id });
        if (!version) return res.status(404).json({ msg: 'Version not found' });
        const fullPath = path.resolve(__dirname, '../../volumes', req.user.id);
        const filePathFull = path.join(fullPath, version.filePath);
        require('fs').writeFileSync(filePathFull, version.content || '');
        res.json({ msg: 'Version restored', content: version.content });
    } catch (err) { res.status(500).json({ msg: err.message }); }
});

module.exports = router;
