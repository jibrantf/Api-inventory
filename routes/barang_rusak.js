// routes/barangRusak.js
const express = require('express');
const router = express.Router();
const barangRusakController = require('../controllers/barangRusakController');
const { authenticateJWT, verifySuperuser } = require('../utils/authMiddleware');
const authorizeRole = require('../utils/authorizeRole');


// Rute untuk mendapatkan semua barang rusak
router.get('/get-barang-rusak', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), barangRusakController.getBarangRusak);

// Rute untuk mendapatkan detail barang rusak
router.get('/detail-barang-rusak/:id_rusak', authenticateJWT, authorizeRole('superuser', 'atasan'), barangRusakController.getBarangRusakById);

// Rute untuk menambahkan barang rusak (hanya superuser dan atasan)
router.post('/add-barang-rusak', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), barangRusakController.addBarangRusak);

// Rute untuk memperbarui barang rusak (hanya superuser dan atasan)
router.put('/update-barang-rusak/:id_rusak', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), barangRusakController.updateBarangRusak);

// Rute untuk menghapus barang rusak (hanya superuser dan atasan)
router.delete('/delete-barang-rusak/:id_rusak', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), barangRusakController.deleteBarangRusak);

module.exports = router;
