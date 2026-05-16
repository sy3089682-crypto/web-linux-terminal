const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Org' },
    plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
    stripeSubscriptionId: { type: String },
    stripeCustomerId: { type: String },
    status: { type: String, enum: ['active', 'past_due', 'canceled', 'trialing'], default: 'trialing' },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    features: {
        maxInstances: { type: Number, default: 5 },
        maxMemoryMb: { type: Number, default: 512 },
        maxStorageGb: { type: Number, default: 5 },
        maxTeamMembers: { type: Number, default: 1 },
        customDomain: { type: Boolean, default: false },
        sso: { type: Boolean, default: false },
        prioritySupport: { type: Boolean, default: false },
        aiAgent: { type: Boolean, default: false },
        versionHistory: { type: Boolean, default: false }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);
