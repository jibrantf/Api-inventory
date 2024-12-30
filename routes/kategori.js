// routes/kategori.js
const express = require('express');
const router = express.Router();
const kategoriController = require('../controllers/kategoriController');
const { authenticateJWT, verifySuperuser } = require('../utils/authMiddleware');
const authorizeRole = require('../utils/authorizeRole');

// Rute untuk mendapatkan semua kategori
router.get('/get-kategori', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), kategoriController.getKategori);

// Rute untuk mendapatkan detail kategori
router.get('/detail-kategori/:id_kategori', authenticateJWT, authorizeRole('superuser', 'atasan'), kategoriController.getKategoriById);

// Rute untuk menambahkan kategori
router.post('/add-kategori', authenticateJWT, authorizeRole('superuser', 'atasan'), kategoriController.addKategori);

// Rute untuk mengupdate kategori
router.put('/update-kategori/:id_kategori', authenticateJWT, authorizeRole('superuser', 'atasan'), kategoriController.updateKategori);

// Rute untuk menghapus kategori
router.delete('/delete-kategori/:id_kategori', authenticateJWT, authorizeRole('superuser', 'atasan'), kategoriController.deleteKategori);

module.exports = router;
