const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Subscription = require('../models/Subscription');
const Org = require('../models/Org');
const User = require('../models/User');

const PLANS = {
    free: { price: 0, maxInstances: 3, maxMemoryMb: 512, maxStorageGb: 2, maxTeamMembers: 1, customDomain: false, sso: false, prioritySupport: false, aiAgent: false, versionHistory: true },
    pro: { price: 29, maxInstances: 20, maxMemoryMb: 4096, maxStorageGb: 50, maxTeamMembers: 10, customDomain: true, sso: false, prioritySupport: false, aiAgent: true, versionHistory: true },
    enterprise: { price: 199, maxInstances: 100, maxMemoryMb: 16384, maxStorageGb: 500, maxTeamMembers: 100, customDomain: true, sso: true, prioritySupport: true, aiAgent: true, versionHistory: true },
};

router.get('/plans', (req, res) => {
    res.json(PLANS);
});

router.get('/subscription', auth, async (req, res) => {
    try {
        let sub = await Subscription.findOne({ userId: req.user.id, orgId: { $exists: false } });
        if (!sub) {
            sub = new Subscription({ userId: req.user.id, plan: 'free', features: PLANS.free });
            await sub.save();
        }
        res.json(sub);
    } catch (err) { res.status(500).json({ msg: err.message }); }
});

router.post('/subscribe', auth, async (req, res) => {
    try {
        const { plan, orgId } = req.body;
        if (!PLANS[plan]) return res.status(400).json({ msg: 'Invalid plan' });
        const filter = orgId ? { orgId } : { userId: req.user.id, orgId: { $exists: false } };
        let sub = await Subscription.findOne(filter);
        if (!sub) {
            sub = new Subscription({ ...filter, plan, features: PLANS[plan], status: 'active', currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
        } else {
            sub.plan = plan;
            sub.features = PLANS[plan];
            sub.status = 'active';
            sub.currentPeriodStart = new Date();
            sub.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
        await sub.save();
        if (orgId) await Org.findByIdAndUpdate(orgId, { plan });
        res.json(sub);
    } catch (err) { res.status(500).json({ msg: err.message }); }
});

router.post('/cancel', auth, async (req, res) => {
    try {
        const { orgId } = req.body;
        const filter = orgId ? { orgId } : { userId: req.user.id, orgId: { $exists: false } };
        const sub = await Subscription.findOne(filter);
        if (sub) {
            sub.status = 'canceled';
            sub.plan = 'free';
            sub.features = PLANS.free;
            await sub.save();
        }
        res.json({ msg: 'Subscription canceled' });
    } catch (err) { res.status(500).json({ msg: err.message }); }
});

module.exports = router;
