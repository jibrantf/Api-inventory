const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); 
require('dotenv').config(); 



exports.login = (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM users WHERE username = ? LIMIT 1';

    pool.query(query, [username], (err, results) => {
        if (err) {
            console.error('Error saat mengakses database:', err);
            return res.status(500).json({ success: false, message: 'Error pada server' });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Username atau password salah' });
        }

        const user = results[0];

        if ((user.role === 'atasan' || user.role === 'user') && user.status !== 'Approved') {
            return res.status(403).json({ success: false, message: 'Akun Anda belum disetujui' });
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Error saat memverifikasi password:', err);
                return res.status(500).json({ success: false, message: 'Error pada server' });
            }

            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Username atau password salah' });
            }

            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
            );

            return res.status(200).json({
                success: true,
                message: 'Login berhasil',
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                },
                token,
            });
        });
    });
};


// Fungsi untuk login superuser
exports.loginSuperuser = (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM users WHERE username = ? AND role = "superuser" LIMIT 1';

    pool.query(query, [username], (err, results) => {
        if (err) {
            console.error('Error saat mengakses database:', err);
            return res.status(500).json({ success: false, message: 'Error pada server' });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Username atau password salah' });
        }

        const user = results[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Error saat memverifikasi password:', err);
                return res.status(500).json({ success: false, message: 'Error pada server' });
            }

            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Username atau password salah' });
            }

            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } 
            );

            return res.status(200).json({
                success: true,
                message: 'Login berhasil',
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                },
                token,
            });
        });
    });
};


// Fungsi untuk registrasi atasan dan user
exports.registerUser = (req, res) => {
    const { username, email, password } = req.body; 

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'Semua field harus diisi' });
    }

    const getLastIdQuery = 'SELECT id FROM users ORDER BY id DESC LIMIT 1';
    pool.query(getLastIdQuery, (err, results) => {
        if (err) {
            console.error('Error saat mengakses database:', err);
            return res.status(500).json({ success: false, message: 'Error pada server' });
        }

        let newId;
        if (results.length > 0) {

            const lastId = results[0].id;
            const lastNumber = parseInt(lastId.substring(1), 10); 
            newId = `U${String(lastNumber + 1).padStart(2, '0')}`; 
        } else {
            newId = 'U01';
        }

        // Hash password
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                console.error('Error saat hashing password:', err);
                return res.status(500).json({ success: false, message: 'Error pada server' });
            }

            const query = 'INSERT INTO users (id, username, email, password, role, status) VALUES (?, ?, ?, ?, "user", "Pending")';
            pool.query(query, [newId, username, email, hash], (err, results) => {
                if (err) {
                    console.error('Error saat registrasi:', err);
                    return res.status(500).json({ success: false, message: 'Error pada server' });
                }

                return res.status(201).json({ 
                    success: true, 
                    message: 'Registrasi berhasil, menunggu persetujuan',
                    user: {
                        id: newId,
                        username,
                        email,
                        role: 'user', 
                        status: 'Pending'
                    }
                });
            });
        });
    });
};



// Fungsi untuk login atasan dan user
exports.loginUsers = (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM users WHERE username = ? AND (role = "atasan" OR role = "user") LIMIT 1';

    pool.query(query, [username], (err, results) => {
        if (err) {
            console.error('Error saat mengakses database:', err);
            return res.status(500).json({ success: false, message: 'Error pada server' });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Username atau password salah' });
        }

        const user = results[0];

        if (user.status !== 'Approved') {
            return res.status(403).json({ success: false, message: 'Akun Anda belum disetujui' });
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Error saat memverifikasi password:', err);
                return res.status(500).json({ success: false, message: 'Error pada server' });
            }

            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Username atau password salah' });
            }

            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } 
            );

            return res.status(200).json({
                success: true,
                message: 'Login berhasil',
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                },
                token,
            });
        });
    });
};


// Fungsi untuk persetujuan pengguna
exports.approveUser = (req, res) => {
    const userId = req.params.userId;
    const { role } = req.body;

    const validRoles = ['user', 'atasan'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ success: false, message: 'Role tidak valid' });
    }

    const query = 'UPDATE users SET status = "Approved", role = ? WHERE id = ?';
    pool.query(query, [role, userId], (err, results) => {
        if (err) {
            console.error('Error saat persetujuan pengguna:', err);
            return res.status(500).json({ success: false, message: 'Error pada server' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }

        return res.status(200).json({ success: true, message: `User telah disetujui sebagai ${role}` });
    });
};



// Fungsi untuk mendapatkan daftar pengguna yang masih Pending
exports.getPendingUsers = (req, res) => {
    const query = 'SELECT id, username, email, role FROM users WHERE status = ? AND deleted_at IS NULL';
    const status = 'Pending';

    pool.query(query, [status], (err, results) => {
        if (err) {
            console.error('Error saat mengambil data pengguna Pending:', err);
            return res.status(500).json({ success: false, message: 'Error pada server' });
        }

        if (results.length === 0) {
            return res.status(200).json({ success: false, message: 'Tidak ada pengguna Pending' });
        }

        return res.status(200).json({
            success: true,
            message: 'Daftar pengguna Pending berhasil diambil',
            users: results,
        });
    });
};



// Fungsi untuk mendapatkan daftar pengguna yang sudah disetujui
exports.getApprovedUsers = (req, res) => {
    const query = 'SELECT id, username, email, role FROM users WHERE status = "Approved" AND deleted_at IS NULL';

    pool.query(query, (err, results) => {
        if (err) {
            console.error('Error saat mengambil data pengguna disetujui:', err);
            return res.status(500).json({ success: false, message: 'Error pada server' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Tidak ada pengguna disetujui' });
        }

        return res.status(200).json({
            success: true,
            message: 'Daftar pengguna disetujui berhasil diambil',
            users: results,
        });
    });
};

// Fungsi untuk mendapatkan semua pengguna (Pending dan Approved)
exports.getAllUsers = (req, res) => {
    const query = 'SELECT id, username, email, role, status FROM users WHERE deleted_at IS NULL';

    pool.query(query, (err, results) => {
        if (err) {
            console.error('Error saat mengambil data semua pengguna:', err);
            return res.status(500).json({ success: false, message: 'Error pada server' });
        }

        return res.status(200).json({
            success: true,
            message: 'Daftar semua pengguna berhasil diambil',
            users: results,
        });
    });
};


// Fungsi untuk menghapus pengguna
exports.deleteUser = (req, res) => {
    const userId = req.params.userId;

    const query = 'UPDATE users SET deleted_at = NOW() WHERE id = ?';
    pool.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error saat menghapus pengguna:', err);
            return res.status(500).json({ success: false, message: 'Error pada server' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }

        return res.status(200).json({ success: true, message: 'User telah dihapus' });
    });
};




// Fungsi Logout
exports.logout = (req, res) => {
    // Menghapus token di frontend saja
    res.status(200).json({
        success: true,
        message: 'Logout berhasil'
    });
};
