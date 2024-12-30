// routes/barangKeluar.js
const express = require('express');
const router = express.Router();
const barangKeluarController = require('../controllers/barangKeluarController');
const { authenticateJWT, verifySuperuser } = require('../utils/authMiddleware');
const authorizeRole = require('../utils/authorizeRole');


// Rute untuk mendapatkan semua barang keluar
router.get('/get-barang-keluar', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), barangKeluarController.getBarangKeluar);

// Rute untuk mendapatkan detail barang keluar
router.get('/detail-barang-keluar/:id_keluar', authenticateJWT, authorizeRole('superuser', 'atasan'), barangKeluarController.getBarangKeluarById);

// Rute untuk menambahkan barang keluar (hanya superuser dan atasan)
router.post('/add-barang-keluar', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), barangKeluarController.addBarangKeluar);

// Rute untuk memperbarui barang keluar (hanya superuser dan atasan)
router.put('/update-barang-keluar/:id_keluar', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), barangKeluarController.updateBarangKeluar);

// Rute untuk menghapus barang keluar (hanya superuser dan atasan)
router.delete('/delete-barang-keluar/:id', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), barangKeluarController.deleteBarangKeluar);

module.exports = router;
