const mongoose = require('mongoose');

const InstanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    containerId: { type: String },
    port: { type: Number }, // Port for web previews
    status: { type: String, enum: ['running', 'stopped'], default: 'stopped' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Instance', InstanceSchema);
