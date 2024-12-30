const jwt = require('jsonwebtoken');

// Middleware untuk mengautentikasi JWT
exports.authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'Token tidak ditemukan' });
    }

    // Menghilangkan "Bearer " dari token
    const bearerToken = token.split(' ')[1];

    jwt.verify(bearerToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token tidak valid' });
        }

        // Simpan informasi pengguna dalam req.user
        req.user = decoded; // menyimpan informasi pengguna dari token
        next(); // Lanjutkan ke rute berikutnya
    });
};

// Middleware untuk memverifikasi superuser
exports.verifySuperuser = (req, res, next) => {
    // Pastikan authenticateJWT telah dijalankan sebelumnya
    if (!req.user || req.user.role !== 'superuser') {
        return res.status(403).json({ message: 'Akses ditolak, hanya superuser yang dapat mengakses ini' });
    }

    next(); // Lanjutkan ke rute berikutnya jika user adalah superuser
};
