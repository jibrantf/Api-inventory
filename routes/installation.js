const express = require('express');
const router = express.Router();
const installationController = require('../controllers/installationController');
const { authenticateJWT, verifySuperuser } = require('../utils/authMiddleware');
const authorizeRole = require('../utils/authorizeRole');


router.get('/type/:type', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), installationController.getInstallationsByDeviceType);

router.get('/device/all-serial_number_device/OFA', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), installationController.getAllDeviceSerialNumbersByOFA);
router.get('/device/all-serial_number_device/SDFMS', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), installationController.getAllDeviceSerialNumbersBySDFMS);
router.get('/device/all-serial_number_device/MANTULGRADER', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), installationController.getAllDeviceSerialNumbersByMANTULGRADER);
router.get('/device/all-serial_number_device/SAFELIGHT', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), installationController.getAllDeviceSerialNumbersBySAFELIGHT);

router.get('/device/serial_number_device/OFA', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), installationController.getDeviceSerialNumbersForOFA);
router.get('/device/serial_number_device/SDFMS', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), installationController.getDeviceSerialNumbersForSDFMS);
router.get('/device/serial_number_device/MANTULGRADER', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), installationController.getDeviceSerialNumbersForMANTULGRADER);
router.get('/device/serial_number_device/SAFELIGHT', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), installationController.getDeviceSerialNumbersForSAFELIGHT);

router.post('/add-installation', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), installationController.addInstallation);

router.put('/update-installation/:id_installation', authenticateJWT, authorizeRole('superuser', 'atasan', 'user'), installationController.updateInstallationById);


module.exports = router;