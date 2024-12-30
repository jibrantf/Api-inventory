const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Fungsi untuk mendapatkan daftar users yang masih pending
exports.getPendingUsers = (req, res) => {
    const query = 'SELECT id, username, email, role FROM users WHERE status = "pending"';

    pool.query(query, (err, results) => {
        if (err) {
            console.error('Error saat mengambil data pengguna pending:', err);
            return res.status(500).json({ success: false, message: 'Error pada server' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Tidak ada pengguna pending' });
        }

        return res.status(200).json({
            success: true,
            message: 'Daftar pengguna pending berhasil diambil',
            users: results,
        });
    });
};
