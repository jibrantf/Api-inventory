const jwt = require('jsonwebtoken');

// Middleware untuk mengautentikasi JWT
exports.authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'Token tidak ditemukan' });
    }
    const bearerToken = token.split(' ')[1];

    jwt.verify(bearerToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token tidak valid' });
        }

        req.user = decoded; 
        next();
    });
};

// Middleware untuk memverifikasi superuser
exports.verifySuperuser = (req, res, next) => {
    if (!req.user || req.user.role !== 'superuser') {
        return res.status(403).json({ message: 'Akses ditolak, hanya superuser yang dapat mengakses ini' });
    }

    next(); 
};
