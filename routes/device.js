const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { authenticateJWT, verifySuperuser } = require('../utils/authMiddleware');
const authorizeRole = require('../utils/authorizeRole');



router.get('/dashboard-device/:type', authenticateJWT, authorizeRole('superuser', 'user', 'atasan'), deviceController.getDashboardDeviceByType);

// Rute untuk mendapatkan semua part_box dari device_produksi
router.get('/all-device', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), deviceController.getAllDevice);

router.get('/status-count/:type', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), deviceController.getDeviceStatusCount);

router.get('/device/type/:type', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), deviceController.getDevicesByType);

router.get('/device-all-data/:type', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), deviceController.getDevicesAllDataByType);

router.post('/add-device', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), deviceController.addDevice);

router.put('/update-device/:id_device', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), deviceController.updateDevice);

router.delete('/delete-device/:id_device', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), deviceController.deleteDevice );

module.exports = router;