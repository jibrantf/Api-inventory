const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../utils/authMiddleware');

// Route untuk mendapatkan daftar users yang pending (hanya untuk superuser)
router.get('/pending', authMiddleware.verifySuperuser, userController.getPendingUsers);

module.exports = router;
