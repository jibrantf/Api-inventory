const pool = require('../config/db');
const { format } = require('date-fns');

exports.getDashboardDeviceByType = (req, res) => {
    const { type } = req.params;

    if (!type) {
        return res.status(400).json({
            success: false,
            message: "Tipe perangkat (type) harus disertakan dalam permintaan.",
        });
    }

    // Query untuk menghitung jumlah perangkat berdasarkan status
    const queryDeviceStatusCount = `
        SELECT 
            type,
            status,
            COUNT(*) AS total
        FROM device
        WHERE deleted_at IS NULL AND type = ?
        GROUP BY type, status;
    `;

    // Query untuk mengambil perangkat terbaru yang dipasang
    const queryRecentInstallations = `
        SELECT 
            installation.id_installation,
            device.serial_number_device AS serial_number_device,
            installation.created_at,
            installation.lokasi
        FROM installation
        JOIN device ON installation.id_device = device.id_device
        WHERE device.deleted_at IS NULL AND device.type = ?
        ORDER BY installation.created_at DESC
        LIMIT 3;
    `;

    // Query untuk mengambil perangkat yang baru saja dirawat
    const queryRecentMaintenance = `
        SELECT 
            maintenance.id_maintenance,
            device.serial_number_device AS serial_number_device,
            maintenance.history,
            maintenance.created_at
        FROM maintenance
        JOIN device ON maintenance.id_device = device.id_device
        WHERE device.deleted_at IS NULL AND device.type = ?
        ORDER BY maintenance.created_at DESC
        LIMIT 3;
    `;

    // Query untuk menghitung total perangkat
    const queryDeviceCount = `
        SELECT COUNT(*) AS total_devices 
        FROM device 
        WHERE type = ? AND deleted_at IS NULL;
    `;

    // Query untuk menghitung jumlah kategori maintenance
    const queryMaintenanceCategoriesCount = `
        SELECT 
            kategori_maintenance,
            COUNT(*) AS total
        FROM maintenance
        JOIN device ON maintenance.id_device = device.id_device
        WHERE device.deleted_at IS NULL AND device.type = ?
        GROUP BY kategori_maintenance;
    `;

    // Query tambahan untuk menghitung perangkat berdasarkan tipe
    const queryDeviceByType = `
        SELECT type, COUNT(*) AS total_devices 
        FROM device
        WHERE deleted_at IS NULL
        GROUP BY type;
    `;

    pool.query(queryDeviceStatusCount, [type], (err1, deviceStatusResults) => {
        if (err1) return handleError(res, err1);

        const formattedDeviceStatus = [
            { status: 'stok', total: 0 }, 
            { status: 'terpasang', total: 0 }, 
            { status: 'repair', total: 0 },  
        ];

        // Sesuaikan status perangkat dalam hasil
        deviceStatusResults.forEach(item => {
            let status = item.status;
            if (status === 'offline') status = 'repair'; 
            if (status === 'online') status = 'terpasang'; 
            

            const statusIndex = formattedDeviceStatus.findIndex(entry => entry.status === status);
            if (statusIndex !== -1) {
                formattedDeviceStatus[statusIndex].total = item.total;
            }
        });

        pool.query(queryRecentInstallations, [type], (err2, recentInstallationsResults) => {
            if (err2) return handleError(res, err2);

            pool.query(queryRecentMaintenance, [type], (err3, recentMaintenanceResults) => {
                if (err3) return handleError(res, err3);

                pool.query(queryDeviceCount, [type], (err4, deviceCountResults) => {
                    if (err4) return handleError(res, err4);

                    pool.query(queryMaintenanceCategoriesCount, [type], (err5, maintenanceCategoriesResults) => {
                        if (err5) return handleError(res, err5);

                        const maintenanceCategoriesData = maintenanceCategoriesResults.map(item => ({
                            kategori: item.kategori_maintenance,
                            total: item.total
                        }));

                        pool.query(queryDeviceByType, (err6, deviceByTypeResults) => {
                            if (err6) return handleError(res, err6);

                            const deviceByTypeData = deviceByTypeResults.map(item => ({
                                type: item.type,
                                total_devices: item.total_devices
                            }));

                            res.status(200).json({
                                success: true,
                                message: `Dashboard data untuk perangkat tipe ${type} berhasil diambil.`,
                                data: {
                                    totalDevices: deviceCountResults[0]?.total_devices || 0,
                                    deviceStatus: formattedDeviceStatus, 
                                    recentInstallations: recentInstallationsResults,
                                    maintenanceCategories: maintenanceCategoriesData,
                                    recentMaintenance: recentMaintenanceResults,
                                    devicesByType: deviceByTypeData
                                }
                            });
                        });
                    });
                });
            });
        });
    });
};

// Fungsi handleError untuk menyederhanakan penanganan error
const handleError = (res, err) => {
    console.error("Database Error:", err);
    return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server.",
        error: err.message
    });
};


    
// Controller untuk mendapatkan semua device
exports.getAllDevice = (req, res) => {
    const query = `
        SELECT 
            d.id_device, 
            d.serial_number_device AS serial_number_device, 
            d.type, 
            d.versi_modul, 
            d.versi_firmware, 
            d.tanggal_produksi,
            d.created_at,
            d.created_by,
            u.username AS created_by_username
        FROM device d
        LEFT JOIN users u ON d.created_by = u.id
        WHERE d.deleted_at IS NULL
    `;

    pool.query(query, (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil data device.',
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Data device tidak ditemukan.'
            });
        }

        const formattedResults = results.map(device => {
            const formattedTanggalProduksi = format(new Date(device.tanggal_produksi), 'yyyy-MM-dd');
            const formattedCreatedAt = format(new Date(device.created_at), 'yyyy-MM-dd HH:mm:ss');
            return {
                id_device: device.id_device,
                serial_number_device: device.serial_number_device,
                type: device.type,
                versi_modul: device.versi_modul,
                versi_firmware: device.versi_firmware,
                tanggal_produksi: formattedTanggalProduksi,
                created_at: formattedCreatedAt,
                created_by: {
                    id: device.created_by,
                    username: device.created_by_username
                }
            };
        });

        res.status(200).json({
            success: true,
            message: 'Data device berhasil diambil.',
            data: formattedResults
        });
    });
};


exports.getDevicesByType = (req, res) => {
    const { type } = req.params; 

    const query = `
        SELECT 
            d.id_device, 
            d.serial_number_device AS serial_number_device, 
            d.type, 
            d.versi_modul, 
            d.versi_firmware, 
            d.tanggal_produksi,
            d.created_at,
            d.created_by,
            d.status, -- Status perangkat tetap ditampilkan di sini
            u.username AS created_by_username
        FROM device d
        LEFT JOIN users u ON d.created_by = u.id
        WHERE d.type = ? AND d.deleted_at IS NULL
        ORDER BY d.created_at ASC
    `;

    pool.query(query, [type], (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil data device berdasarkan type.',
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Data device dengan type ${type} tidak ditemukan.`
            });
        }

        const formattedResults = results.map(device => {
            const formattedTanggalProduksi = device.tanggal_produksi
                ? format(new Date(device.tanggal_produksi), 'yyyy-MM-dd')
                : null;
            const formattedCreatedAt = device.created_at
                ? format(new Date(device.created_at), 'yyyy-MM-dd HH:mm:ss')
                : null;

            let status = device.status;
            if (status === 'offline') status = 'repair';  
            if (status === 'online') status = 'terpasang'; 

            return {
                id_device: device.id_device,
                serial_number_device: device.serial_number_device,
                type: device.type,
                versi_modul: device.versi_modul,
                versi_firmware: device.versi_firmware,
                tanggal_produksi: formattedTanggalProduksi,
                created_at: formattedCreatedAt,
                created_by: {
                    id: device.created_by,
                    username: device.created_by_username
                },
                status: status
            };
        });

        res.status(200).json({
            success: true,
            message: `Data device dengan type ${type} berhasil diambil.`,
            data: formattedResults
        });
    });
};


// Controller untuk mendapatkan jumlah stok, terpasang, dan repair berdasarkan type
exports.getDeviceStatusCount = (req, res) => {
    const { type } = req.params; 
    const query = `
        SELECT 
            CASE 
                WHEN status = 'offline' THEN 'repair'  -- Ubah status offline menjadi repair
                WHEN status = 'online' THEN 'terpasang'  -- Ubah status online menjadi terpasang
                ELSE status 
            END AS status, 
            COUNT(*) AS total
        FROM device
        WHERE type = ? AND deleted_at IS NULL
        GROUP BY status
    `;

    pool.query(query, [type], (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil jumlah device berdasarkan status.',
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Data device dengan type ${type} tidak ditemukan.`
            });
        }

        let stockCount = 0;
        let installedCount = 0;
        let repairCount = 0;
        let totalDevices = 0;

        results.forEach(result => {
            if (result.status === 'stok') {
                stockCount = result.total;
            } else if (result.status === 'terpasang') {
                installedCount = result.total;
            } else if (result.status === 'repair') { 
                repairCount = result.total;
            }
            totalDevices += result.total;
        });

        res.status(200).json({
            success: true,
            message: `Jumlah device berdasarkan status untuk type ${type} berhasil diambil.`,
            data: {
                stok: stockCount,
                terpasang: installedCount,
                repair: repairCount,
                total_device: totalDevices 
            }
        });
    });
};

// Controller untuk mendapatkan semua data device berdasarkan type
exports.getDevicesAllDataByType = (req, res) => {
    const { type } = req.params; 

    const queryDevice = `
        SELECT 
            d.id_device, 
            d.serial_number_device, 
            d.type, 
            d.versi_modul, 
            d.versi_firmware, 
            d.tanggal_produksi,
            d.created_at,
            d.created_by,
            d.status,
            u.username AS created_by_username
        FROM device d
        LEFT JOIN users u ON d.created_by = u.id
        WHERE d.type = ? AND d.deleted_at IS NULL
        ORDER BY d.created_at ASC
    `;

    pool.query(queryDevice, [type], (err, devices) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil data device berdasarkan type.',
                error: err.message
            });
        }

        if (devices.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Data device dengan type ${type} tidak ditemukan.`
            });
        }

        const devicePromises = devices.map(device => {
            return new Promise((resolve, reject) => {
                const queryDetails = `
                    SELECT 
                        i.tanggal_installasi,
                        i.warranty,
                        i.lokasi,
                        i.mode_unit,
                        i.code_unit,
                        i.status AS installation_status,
                        m.history,
                        m.kategori_maintenance,  -- Menambahkan kategori_maintenance
                        m.created_at AS maintenance_created_at,
                        m.created_by AS maintenance_created_by,
                        mu.username AS maintenance_created_by_username
                    FROM device d
                    LEFT JOIN installation i ON d.id_device = i.id_device
                    LEFT JOIN maintenance m ON d.id_device = m.id_device
                    LEFT JOIN users mu ON m.created_by = mu.id
                    WHERE d.id_device = ?
                `;

                pool.query(queryDetails, [device.id_device], (detailErr, details) => {
                    if (detailErr) {
                        return reject(detailErr);
                    }

                    const formattedTanggalProduksi = device.tanggal_produksi
                        ? format(new Date(device.tanggal_produksi), 'yyyy-MM-dd')
                        : null;
                    const formattedCreatedAt = device.created_at
                        ? format(new Date(device.created_at), 'yyyy-MM-dd HH:mm:ss')
                        : null;

                    resolve({
                        id_device: device.id_device,
                        serial_number_device: device.serial_number_device,
                        type: device.type,
                        versi_modul: device.versi_modul,
                        versi_firmware: device.versi_firmware,
                        tanggal_produksi: formattedTanggalProduksi,
                        created_at: formattedCreatedAt,
                        created_by: {
                            id: device.created_by,
                            username: device.created_by_username
                        },
                        status: device.status,
                        installation: details.map(detail => ({
                            tanggal_installasi: detail.tanggal_installasi
                                ? format(new Date(detail.tanggal_installasi), 'yyyy-MM-dd')
                                : null,
                            warranty: detail.warranty
                                ? format(new Date(detail.warranty), 'yyyy-MM-dd')
                                : null,
                            lokasi: detail.lokasi,
                            mode_unit: detail.mode_unit,
                            code_unit: detail.code_unit,
                            status: detail.installation_status
                        })),
                        maintenance: details.map(detail => ({
                            history: detail.history,
                            kategori_maintenance: detail.kategori_maintenance,
                            created_at: detail.maintenance_created_at
                                ? format(new Date(detail.maintenance_created_at), 'yyyy-MM-dd HH:mm:ss')
                                : null,
                            created_by: {
                                id: detail.maintenance_created_by,
                                username: detail.maintenance_created_by_username
                            }
                        }))
                    });
                });
            });
        });

        Promise.all(devicePromises)
            .then(results => {
                res.status(200).json({
                    success: true,
                    message: `Data device dengan type ${type} berhasil diambil.`,
                    data: results
                });
            })
            .catch(detailErr => {
                console.error("Database Error:", detailErr);
                res.status(500).json({
                    success: false,
                    message: 'Gagal mengambil data installation atau maintenance.',
                    error: detailErr.message
                });
            });
    });
};





// Controller untuk menambahkan device
exports.addDevice = (req, res) => {
    const { 
        serial_number_device, 
        type, 
        versi_modul, 
        versi_firmware, 
        tanggal_produksi 
    } = req.body;

    const createdBy = req.user.id;

    if (!serial_number_device || !type || !versi_modul || !versi_firmware || !tanggal_produksi) {
        return res.status(400).json({
            success: false,
            message: 'Semua field wajib diisi.'
        });
    }

    const formattedTanggalProduksi = format(new Date(tanggal_produksi), 'yyyy-MM-dd'); 
    const createdAt = format(new Date(), 'yyyy-MM-dd HH:mm:ss'); 

    const checkDuplicateQuery = `SELECT * FROM device WHERE serial_number_device = ?`;

    pool.query(checkDuplicateQuery, [serial_number_device], (checkErr, checkResults) => {
        if (checkErr) {
            console.error("Database Error:", checkErr);
            return res.status(500).json({
                success: false,
                message: 'Gagal memeriksa duplikasi serial number.',
                error: checkErr.message
            });
        }

        if (checkResults.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Serial number sudah digunakan. Gunakan serial number lain.'
            });
        }

        const getLastIdQuery = `
            SELECT id_device
            FROM device
            ORDER BY id_device DESC
            LIMIT 1;
        `;

        pool.query(getLastIdQuery, (err, results) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({
                    success: false,
                    message: 'Gagal mengambil ID terakhir.',
                    error: err.message
                });
            }

            let nextId = 'D00000001';

            if (results.length > 0) {
                const lastId = results[0].id_device;
                const numericPart = parseInt(lastId.slice(1), 10);
                const nextNumericPart = numericPart + 1;

                if (nextNumericPart <= 99999999) {
                    nextId = `D${nextNumericPart.toString().padStart(8, '0')}`;
                } else {
                    return res.status(400).json({
                        success: false,
                        message: "Batas maksimal ID tercapai (D99999999).",
                    });
                }
            }
    
            const status = "stok";

            const insertQuery = `
                INSERT INTO device 
                (id_device, serial_number_device, type, versi_modul, versi_firmware, tanggal_produksi, created_at, created_by, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [
                nextId, 
                serial_number_device, 
                type, 
                versi_modul, 
                versi_firmware, 
                formattedTanggalProduksi, 
                createdAt, 
                createdBy,
                status 
            ];

            pool.query(insertQuery, values, (insertErr, insertResults) => {
                if (insertErr) {
                    console.error("Database Error:", insertErr);
                    return res.status(500).json({
                        success: false,
                        message: 'Gagal menambahkan device.',
                        error: insertErr.message
                    });
                }
                
                pool.query(`
                    SELECT type, COUNT(*) AS total_devices 
                    FROM device
                    WHERE deleted_at IS NULL
                    GROUP BY type;
                `, (err6, deviceByTypeResults) => {
                    if (err6) {
                        console.error("Database Error:", err6);
                        return res.status(500).json({
                            success: false,
                            message: 'Gagal mengambil data devices by type.',
                            error: err6.message
                        });
                    }

                    const deviceByTypeData = deviceByTypeResults.map(item => ({
                        type: item.type,
                        total_devices: item.total_devices
                    }));

                    res.status(201).json({
                        success: true,
                        message: 'Device berhasil ditambahkan.',
                        data: {
                            id_device: nextId,
                            serial_number_device,
                            type,
                            versi_modul,
                            versi_firmware,
                            tanggal_produksi: formattedTanggalProduksi,
                            status,
                            created_at: createdAt,
                            created_by: {
                                id: createdBy,
                                username: req.user.username 
                            },
                            updated_at: createdAt,
                            status, 
                            devicesByType: deviceByTypeData 
                        }
                    });
                });
            });
        });
    });
};


// Controller untuk memperbarui device
exports.updateDevice = (req, res) => {
    const { 
        serial_number_device, 
        type, 
        versi_modul, 
        versi_firmware, 
        tanggal_produksi 
    } = req.body;

    const { id_device } = req.params; 

    if (!serial_number_device || !type || !versi_modul || !versi_firmware || !tanggal_produksi) {
        return res.status(400).json({
            success: false,
            message: 'Semua field wajib diisi.'
        });
    }

    const parsedTanggalProduksi = new Date(tanggal_produksi);
    if (isNaN(parsedTanggalProduksi.getTime())) {
        return res.status(400).json({
            success: false,
            message: 'Format tanggal produksi tidak valid.'
        });
    }

    const formattedTanggalProduksi = format(parsedTanggalProduksi, 'yyyy-MM-dd'); 
    const updatedAt = format(new Date(), 'yyyy-MM-dd HH:mm:ss'); 

    const updateQuery = `
        UPDATE device 
        SET 
            serial_number_device = ?, 
            type = ?, 
            versi_modul = ?, 
            versi_firmware = ?, 
            tanggal_produksi = ?, 
            updated_at = ?
        WHERE id_device = ?
    `;

    const values = [
        serial_number_device, 
        type, 
        versi_modul, 
        versi_firmware, 
        formattedTanggalProduksi, 
        updatedAt,
        id_device
    ];

    pool.query(updateQuery, values, (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({
                success: false,
                message: 'Gagal memperbarui data device.',
                error: err.message
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: `Device dengan ID ${id_device} tidak ditemukan.`
            });
        }

        res.status(200).json({
            success: true,
            message: 'Device berhasil diperbarui.',
            data: {
                id_device,
                serial_number_device,
                type,
                versi_modul,
                versi_firmware,
                tanggal_produksi: formattedTanggalProduksi,
                updated_at: updatedAt
            }
        });
    });
};


exports.deleteDevice = (req, res) => {
    const { id_device } = req.params; 
    const deletedAt = format(new Date(), 'yyyy-MM-dd HH:mm:ss'); 


    const getTypeQuery = `
        SELECT type 
        FROM device 
        WHERE id_device = ? AND deleted_at IS NULL
    `;

    pool.query(getTypeQuery, [id_device], (typeErr, typeResults) => {
        if (typeErr) {
            console.error("Database Error:", typeErr);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil tipe perangkat.',
                error: typeErr.message
            });
        }

        if (typeResults.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Device dengan ID ${id_device} tidak ditemukan atau sudah dihapus.`
            });
        }

        const type = typeResults[0].type;

        const deleteDeviceQuery = `
            UPDATE device 
            SET deleted_at = ? 
            WHERE id_device = ? AND deleted_at IS NULL
        `;
        const values = [deletedAt, id_device];

        pool.query(deleteDeviceQuery, values, (deviceErr, deviceResults) => {
            if (deviceErr) {
                console.error("Database Error:", deviceErr);
                return res.status(500).json({
                    success: false,
                    message: 'Gagal melakukan soft delete pada device.',
                    error: deviceErr.message
                });
            }

            if (deviceResults.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: `Device dengan ID ${id_device} tidak ditemukan atau sudah dihapus.`
                });
            }

            const deleteInstallationQuery = `
                UPDATE installation 
                SET deleted_at = ? 
                WHERE id_device = ? AND deleted_at IS NULL
            `;

            pool.query(deleteInstallationQuery, values, (installErr) => {
                if (installErr) {
                    console.error("Database Error:", installErr);
                    return res.status(500).json({
                        success: false,
                        message: 'Gagal melakukan soft delete pada data installation.',
                        error: installErr.message
                    });
                }

                const deleteMaintenanceQuery = `
                    UPDATE maintenance 
                    SET deleted_at = ? 
                    WHERE id_device = ? AND deleted_at IS NULL
                `;

                pool.query(deleteMaintenanceQuery, values, (maintErr) => {
                    if (maintErr) {
                        console.error("Database Error:", maintErr);
                        return res.status(500).json({
                            success: false,
                            message: 'Gagal melakukan soft delete pada data maintenance.',
                            error: maintErr.message
                        });
                    }
                    exports.getDashboardDeviceByType({ params: { type } }, res);
                });
            });
        });
    });
};
