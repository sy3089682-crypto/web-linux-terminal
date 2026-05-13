const mongoose = require('mongoose');

const InstanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    template: { type: String, enum: ['blank', 'nodejs', 'python', 'react'], default: 'blank' },
    containerId: { type: String },
    port: { type: Number },
    status: { type: String, enum: ['running', 'stopped'], default: 'stopped' },
    sharedTokens: [{ token: String, expiresAt: Date, access: { type: String, enum: ['read', 'write'], default: 'read' } }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Instance', InstanceSchema);
