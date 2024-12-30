// routes/barang.js
const express = require('express');
const router = express.Router();
const barangController = require('../controllers/barangController');
const { authenticateJWT, verifySuperuser } = require('../utils/authMiddleware');
const authorizeRole = require('../utils/authorizeRole');


// Endpoint untuk mendapatkan semua barang
router.get('/get-barang', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), barangController.getAllBarang);

// Endpoint untuk mendapatkan detail barang
router.get('/detail/:id_barang', authenticateJWT, authorizeRole('superuser', 'atasan'), barangController.getBarangById);

// Endpoint untuk mendapatkan semua barang berdasarkan kategorinya
router.get('/get-barang/:id_kategori', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), barangController.getBarangByKategoriId);

// Endpoint untuk menambahkan barang baru
router.post('/add-barang', authenticateJWT, authorizeRole('superuser', 'atasan'), barangController.createBarang);

// Endpoint untuk memperbarui barang
router.put('/update-barang/:id_barang', authenticateJWT, authorizeRole('superuser', 'atasan'), barangController.updateBarangById);

// Endpoint untuk menghapus barang
router.delete('/delete-barang/:id_barang', authenticateJWT, authorizeRole('superuser', 'atasan'), barangController.deleteBarang);

module.exports = router;
