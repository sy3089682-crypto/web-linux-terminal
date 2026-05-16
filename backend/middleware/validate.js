const REQUIRED_ENV = ['JWT_SECRET', 'MONGO_URI'];

module.exports = function validateEnv(req, res, next) {
    const missing = REQUIRED_ENV.filter(key => !process.env[key]);
    if (missing.length) {
        console.error(`Missing required env vars: ${missing.join(', ')}`);
        return res.status(500).json({ msg: 'Server configuration error' });
    }
    next();
};
