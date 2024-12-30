const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authenticateJWT, verifySuperuser } = require('../utils/authMiddleware');
const authorizeRole = require('../utils/authorizeRole');

// Definisikan routes
router.get('/all-file', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), documentController.getAllFiles);
router.get('/file/:id_file', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), documentController.getFileById);
router.get('/file-type/:type', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), documentController.getFilesByType);
router.post('/add-file/:type', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), documentController.uploadFilesByType);
router.delete('/delete-file/:id_file', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), documentController.deleteFile);

// Export router
module.exports = router;    