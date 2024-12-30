const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { authenticateJWT, verifySuperuser } = require('../utils/authMiddleware');
const authorizeRole = require('../utils/authorizeRole');


router.get('/maintenance/type/:type', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), maintenanceController.getMaintenanceByDeviceType);

router.get('/serial_number_with_installation/:type', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), maintenanceController.getDeviceSerialNumbersWithInstallationByType);

router.post('/add-maintenance', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), maintenanceController.addMaintenance );

router.put('/update-maintenance/:id_maintenance', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), maintenanceController.editMaintenance);
module.exports = router;
