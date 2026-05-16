const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    category: { type: String, enum: ['Development', 'AI/ML', 'Database', 'Web', 'Mobile', 'DevOps', 'Security', 'Fun'], default: 'Development' },
    icon: { type: String },
    image: { type: String, default: 'ubuntu:latest' },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String },
    isOfficial: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: true },
    downloads: { type: Number, default: 0 },
    stars: { type: Number, default: 0 },
    files: { type: Map, of: String },
    readme: { type: String },
    setupScript: { type: String },
    ports: { type: [Number], default: [8080] },
    requiredMemory: { type: Number, default: 256 },
    tags: { type: [String] },
    version: { type: String, default: '1.0.0' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Template', TemplateSchema);
