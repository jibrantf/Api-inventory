const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateJWT, verifySuperuser } = require('../utils/authMiddleware');
const authorizeRole = require('../utils/authorizeRole');



//Rute untuk Login
router.post('/login', authController.login);

// Rute untuk login superuser
router.post('/login/superuser', authController.loginSuperuser);

// Rute untuk registrasi atasan dan user
router.post('/register', authController.registerUser);

// Rute untuk login atasan dan user
router.post('/login-users', authController.loginUsers);

// Rute untuk persetujuan pengguna (hanya untuk superuser)
router.put('/approve/:userId', authenticateJWT, authorizeRole('superuser'), authController.approveUser);

// Rute untuk mendapatkan daftar users yang pending (hanya untuk superuser)
router.get('/pending-users', authenticateJWT, authorizeRole('superuser'), authController.getPendingUsers);

// Rute untuk mendapatkan daftar pengguna yang sudah disetujui (hanya untuk superuser)
router.get('/approved-users', authenticateJWT, authorizeRole('superuser'), authController.getApprovedUsers);

// Rute untuk mendapatkan semua pengguna (hanya untuk superuser)
router.get('/all-users', authenticateJWT, authorizeRole('superuser'), authController.getAllUsers);

// Endpoint untuk menghapus pengguna
router.delete('/deleted-users/:userId', authenticateJWT, authorizeRole('superuser'), authController.deleteUser);

// Rute untuk logout
router.post('/logout', authController.logout);

module.exports = router;
