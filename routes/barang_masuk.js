// routes/barangMasuk.js
const express = require('express');
const router = express.Router();
const BarangMasukController = require('../controllers/barangMasukController');
const { authenticateJWT, verifySuperuser } = require('../utils/authMiddleware');
const authorizeRole = require('../utils/authorizeRole');


// Rute untuk mendapatkan semua barang masuk
router.get('/get-barang-masuk', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), BarangMasukController.getAllBarangMasuk);

// Rute untuk mendapatkan detail barang masuk
router.get('/detail-barang-masuk/:id_masuk', authenticateJWT, authorizeRole('superuser', 'atasan'), BarangMasukController.getBarangMasukById);

// Rute untuk menambahkan barang masuk (hanya superuser dan atasan)
router.post('/add-barang-masuk', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), BarangMasukController.addBarangMasuk);

// Rute untuk memperbarui barang masuk (hanya superuser dan atasan)
router.put('/update-barang-masuk/:id_masuk', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), BarangMasukController.updateBarangMasuk);

// Rute untuk menghapus barang masuk (hanya superuser dan atasan)
router.delete('/delete-barang-masuk/:id_masuk', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), BarangMasukController.deleteBarangMasuk);

module.exports = router;
