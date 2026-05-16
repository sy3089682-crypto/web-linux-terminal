const mongoose = require('mongoose');

const OrgSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' },
        joinedAt: { type: Date, default: Date.now }
    }],
    plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    customDomain: { type: String },
    settings: {
        maxInstances: { type: Number, default: 5 },
        maxMemoryPerInstance: { type: Number, default: 512 },
        allowedTemplates: { type: [String], default: ['blank', 'nodejs', 'python', 'react', 'desktop'] },
        ssoEnabled: { type: Boolean, default: false },
        ssoProvider: { type: String },
        ssoMetadata: { type: String }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Org', OrgSchema);
