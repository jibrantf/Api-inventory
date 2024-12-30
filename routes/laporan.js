const express = require('express');
const router = express.Router();
const laporanController = require('../controllers/laporanController');

// Route untuk menampilkan laporan barang dengan opsi filter tanggal
router.get('/laporan', laporanController.getLaporan);

module.exports = router;