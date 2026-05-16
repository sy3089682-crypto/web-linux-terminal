const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Org = require('../models/Org');
const Subscription = require('../models/Subscription');

function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

router.get('/', auth, async (req, res) => {
    try {
        const orgs = await Org.find({ $or: [{ ownerId: req.user.id }, { 'members.userId': req.user.id }] });
        res.json(orgs);
    } catch (err) { res.status(500).json({ msg: err.message }); }
});

router.post('/', auth, async (req, res) => {
    try {
        const { name } = req.body;
        const slug = `${slugify(name)}-${Date.now().toString(36)}`;
        const org = new Org({ name, slug, ownerId: req.user.id, members: [{ userId: req.user.id, role: 'admin' }] });
        await org.save();
        res.json(org);
    } catch (err) { res.status(500).json({ msg: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const org = await Org.findById(req.params.id).populate('members.userId', 'username avatar');
        if (!org) return res.status(404).json({ msg: 'Org not found' });
        const isMember = org.members.some(m => m.userId?._id.toString() === req.user.id);
        if (!isMember && org.ownerId.toString() !== req.user.id) return res.status(403).json({ msg: 'Access denied' });
        res.json(org);
    } catch (err) { res.status(500).json({ msg: err.message }); }
});

router.post('/:id/members', auth, async (req, res) => {
    try {
        const { userId, role } = req.body;
        const org = await Org.findById(req.params.id);
        if (!org || org.ownerId.toString() !== req.user.id) return res.status(403).json({ msg: 'Only owner can add members' });
        const sub = await Subscription.findOne({ orgId: org._id });
        const maxMembers = sub?.features?.maxTeamMembers || 1;
        if (org.members.length >= maxMembers) return res.status(400).json({ msg: `Team member limit (${maxMembers}) reached. Upgrade plan.` });
        if (org.members.some(m => m.userId.toString() === userId)) return res.status(400).json({ msg: 'Already a member' });
        org.members.push({ userId, role: role || 'member' });
        await org.save();
        res.json(org);
    } catch (err) { res.status(500).json({ msg: err.message }); }
});

router.delete('/:id/members/:userId', auth, async (req, res) => {
    try {
        const org = await Org.findById(req.params.id);
        if (!org || org.ownerId.toString() !== req.user.id) return res.status(403).json({ msg: 'Access denied' });
        org.members = org.members.filter(m => m.userId.toString() !== req.params.userId);
        await org.save();
        res.json(org);
    } catch (err) { res.status(500).json({ msg: err.message }); }
});

router.post('/:id/domain', auth, async (req, res) => {
    try {
        const { domain } = req.body;
        const org = await Org.findById(req.params.id);
        if (!org || org.ownerId.toString() !== req.user.id) return res.status(403).json({ msg: 'Access denied' });
        const sub = await Subscription.findOne({ orgId: org._id });
        if (!sub?.features?.customDomain) return res.status(400).json({ msg: 'Custom domains require Pro plan' });
        org.customDomain = domain;
        await org.save();
        res.json(org);
    } catch (err) { res.status(500).json({ msg: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const org = await Org.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
        if (!org) return res.status(404).json({ msg: 'Not found' });
        res.json({ msg: 'Org deleted' });
    } catch (err) { res.status(500).json({ msg: err.message }); }
});

module.exports = router;
