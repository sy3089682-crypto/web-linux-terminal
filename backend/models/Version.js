const mongoose = require('mongoose');

const VersionSchema = new mongoose.Schema({
    instanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Instance', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filePath: { type: String, required: true },
    content: { type: String },
    size: { type: Number },
    hash: { type: String },
    action: { type: String, enum: ['create', 'edit', 'save', 'delete'], default: 'save' },
    description: { type: String },
    metadata: { type: Map, of: String },
    createdAt: { type: Date, default: Date.now }
});

VersionSchema.index({ instanceId: 1, filePath: 1, createdAt: -1 });
VersionSchema.index({ instanceId: 1, createdAt: -1 });

module.exports = mongoose.model('Version', VersionSchema);
