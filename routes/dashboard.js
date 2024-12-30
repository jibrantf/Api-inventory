const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateJWT, verifySuperuser } = require('../utils/authMiddleware');
const authorizeRole = require('../utils/authorizeRole');


// Route untuk menampilkan data dashboard
router.get('/dashboard', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), dashboardController.getDashboardData);

router.get('/total-jumlah-transaksi-barang',  authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), dashboardController.getTotalBarangData);

module.exports = router;
