

/**
 * Middleware untuk otorisasi berdasarkan role pengguna.
 * @param {...string} allowedRoles - Daftar role yang diizinkan mengakses endpoint.
 * @returns {function} Middleware Express untuk melanjutkan atau menolak akses.
 */
function authorizeRole(...allowedRoles) {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Unauthorized: Anda belum melakukan autentikasi.' });
            }
            const userRole = req.user.role;

            // Cek apakah role pengguna termasuk dalam daftar role yang diizinkan
            if (!allowedRoles.includes(userRole)) {
                console.log(`Akses ditolak untuk role: ${userRole}. Diizinkan: ${allowedRoles.join(', ')}`);
                return res.status(403).json({ message: 'Akses ditolak: Anda tidak memiliki izin untuk mengakses resource ini.' });
            }

            next();
        } catch (error) {
            console.error('Kesalahan di middleware authorizeRole:', error);
            res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
        }
    };
}

module.exports = authorizeRole;
