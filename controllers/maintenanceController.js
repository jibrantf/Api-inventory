const pool = require('../config/db');
const { format } = require('date-fns');


// Mengambil data maintenance berdasarkan type
exports.getMaintenanceByDeviceType = (req, res) => {
    const { type } = req.params; 

    const query = `
        SELECT 
            m.id_maintenance,
            m.id_device,
            d.serial_number_device,
            m.history,
            m.kategori_maintenance,  -- Menambahkan kolom kategori_maintenance
            d.type AS device_type,
            m.created_by,
            m.created_at,
            u.username AS created_by_username  -- Mengambil username dari tabel users
        FROM maintenance m
        LEFT JOIN device d ON m.id_device = d.id_device
        LEFT JOIN users u ON m.created_by = u.id
        WHERE d.type = ? AND m.deleted_at IS NULL
    `;

    pool.query(query, [type], (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({
                success: false,
                message: `Gagal mengambil data maintenance berdasarkan type ${type}.`,
                error: err.message,
            });
        }

        if (results.length === 0) {
            return res.status(200).json({
                success: true,
                message: `Data maintenance dengan type device ${type} tidak ditemukan.`,
                data: [],
            });
        }

        const formattedResults = results.map(maintenance => ({
            id_maintenance: maintenance.id_maintenance,
            id_device: maintenance.id_device,
            serial_number_device: maintenance.serial_number_device,
            history: maintenance.history,
            kategori_maintenance: maintenance.kategori_maintenance, 
            type: maintenance.device_type,
            created_by: {
                id: maintenance.created_by,
                username: maintenance.created_by_username
            },
            created_at: format(new Date(maintenance.created_at), 'yyyy-MM-dd HH:mm:ss'),
        }));

        res.status(200).json({
            success: true,
            message: `Data maintenance dengan type device ${type} berhasil diambil.`,
            data: formattedResults,
        });
    });
};

// Controller untuk mengambil serial number perangkat yang sudah memiliki data installation berdasarkan type
exports.getDeviceSerialNumbersWithInstallationByType = (req, res) => {
    const { type } = req.params;

    const query = `
        SELECT d.id_device, d.serial_number_device
        FROM device d
        INNER JOIN installation i ON d.id_device = i.id_device
        WHERE d.deleted_at IS NULL AND i.deleted_at IS NULL AND d.type = ?
    `;

    pool.query(query, [type], (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({
                success: false,
                message: `Gagal mengambil daftar serial number perangkat dengan type '${type}' yang sudah terinstall.`,
                error: err.message,
            });
        }

        res.status(200).json({
            success: true,
            data: results,
        });
    });
};


// Controller untuk mengambil serial number perangkat yang sudah memiliki data installation berdasarkan type
exports.getDeviceSerialNumbersWithInstallationByType = (req, res) => {
    const { type } = req.params;

    const query = `
        SELECT d.id_device, d.serial_number_device
        FROM device d
        INNER JOIN installation i ON d.id_device = i.id_device
        WHERE d.deleted_at IS NULL AND i.deleted_at IS NULL AND d.type = ?
    `;

    pool.query(query, [type], (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({
                success: false,
                message: `Gagal mengambil daftar serial number perangkat dengan type '${type}' yang sudah terinstall.`,
                error: err.message,
            });
        }

        res.status(200).json({
            success: true,
            data: results,
        });
    });
};


// Controller untuk menambahkan data maintenance
exports.addMaintenance = (req, res) => {
    const { id_device, history, kategori_maintenance } = req.body;
    const created_by = req.user.id;
    const created_at = new Date(); 

    const getDeviceQuery = `
        SELECT d.id_device, d.serial_number_device, d.type
        FROM device d
        WHERE d.id_device = ? AND d.deleted_at IS NULL
    `;

    pool.query(getDeviceQuery, [id_device], (err, deviceResult) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data perangkat.",
                error: err.message,
            });
        }

        if (deviceResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Perangkat dengan id_device tersebut tidak ditemukan.",
            });
        }

        const { serial_number_device, type } = deviceResult[0];

        const getLastMaintenanceQuery = `
            SELECT id_maintenance
            FROM maintenance
            ORDER BY created_at DESC
            LIMIT 1
        `;

        pool.query(getLastMaintenanceQuery, (err, lastMaintenanceResult) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Gagal mengambil data maintenance terakhir.",
                    error: err.message,
                });
            }

            let newIdMaintenance = 'MN0000001';
            if (lastMaintenanceResult.length > 0) {
                const lastId = lastMaintenanceResult[0].id_maintenance;
                const lastNumber = parseInt(lastId.substring(2), 10);
                newIdMaintenance = `MN${(lastNumber + 1).toString().padStart(7, '0')}`;
            }

            const addMaintenanceQuery = `
                INSERT INTO maintenance (id_maintenance, id_device, history, kategori_maintenance, created_by, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            pool.query(
                addMaintenanceQuery,
                [newIdMaintenance, id_device, history, kategori_maintenance, created_by, created_at],
                (err, result) => {
                    if (err) {
                        console.error("Database Error:", err);
                        return res.status(500).json({
                            success: false,
                            message: "Gagal menambahkan data maintenance.",
                            error: err.message,
                        });
                    }

                    const queryMaintenanceCategoriesCount = `
                        SELECT 
                            kategori_maintenance,
                            COUNT(*) AS total
                        FROM maintenance
                        JOIN device ON maintenance.id_device = device.id_device
                        WHERE device.deleted_at IS NULL AND device.type = ?
                        GROUP BY kategori_maintenance;
                    `;

                    pool.query(queryMaintenanceCategoriesCount, [type], (err, maintenanceCategoriesResults) => {
                        if (err) {
                            console.error("Database Error:", err);
                            return res.status(500).json({
                                success: false,
                                message: "Gagal mengambil data kategori maintenance.",
                                error: err.message,
                            });
                        }

                        const maintenanceCategoriesData = maintenanceCategoriesResults.map(item => ({
                            kategori: item.kategori_maintenance,
                            total: item.total,
                        }));

                        res.status(200).json({
                            success: true,
                            message: "Data maintenance berhasil ditambahkan dan data kategori maintenance diperbarui.",
                            data: {
                                id_maintenance: newIdMaintenance,
                                id_device: id_device,
                                serial_number_device: serial_number_device,
                                history: history,
                                kategori_maintenance: kategori_maintenance,
                                type: type,
                                created_by: created_by,
                                created_at: created_at,
                                updatedMaintenanceCategories: maintenanceCategoriesData,
                            },
                        });
                    });
                }
            );
        });
    });
};






exports.editMaintenance = (req, res) => {
    const { id_device, history } = req.body; 
    const { id_maintenance } = req.params;
    const updated_by = req.user.id; 
    const updated_at = new Date();


    const getDeviceQuery = `
        SELECT d.id_device, d.serial_number_device, d.type
        FROM device d
        WHERE d.id_device = ? AND d.deleted_at IS NULL
    `;

    pool.query(getDeviceQuery, [id_device], (err, deviceResult) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data perangkat.",
                error: err.message,
            });
        }

        if (deviceResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Perangkat dengan id_device tersebut tidak ditemukan.",
            });
        }

        const { serial_number_device, type } = deviceResult[0];

        const checkMaintenanceQuery = `
            SELECT * FROM maintenance
            WHERE id_maintenance = ? AND deleted_at IS NULL
        `;

        pool.query(checkMaintenanceQuery, [id_maintenance], (err, maintenanceResult) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Gagal memeriksa data maintenance.",
                    error: err.message,
                });
            }

            if (maintenanceResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Data maintenance dengan id_maintenance tersebut tidak ditemukan.",
                });
            }

            const updateMaintenanceQuery = `
                UPDATE maintenance
                SET id_device = ?, history = ?, updated_by = ?, updated_at = ?
                WHERE id_maintenance = ?
            `;

            pool.query(updateMaintenanceQuery, [id_device, history, updated_by, updated_at, id_maintenance], (err, result) => {
                if (err) {
                    console.error("Database Error:", err);
                    return res.status(500).json({
                        success: false,
                        message: "Gagal memperbarui data maintenance.",
                        error: err.message,
                    });
                }

                const getUsernameQuery = `
                    SELECT username FROM users WHERE id = ?
                `;

                pool.query(getUsernameQuery, [updated_by], (err, userResult) => {
                    if (err) {
                        console.error("Database Error:", err);
                        return res.status(500).json({
                            success: false,
                            message: "Gagal mengambil data user.",
                            error: err.message,
                        });
                    }

                    const updated_by_username = userResult.length > 0 ? userResult[0].username : 'Unknown';

                    const formattedUpdatedAt = format(new Date(updated_at), 'yyyy-MM-dd HH:mm:ss');

                    res.status(200).json({
                        success: true,
                        message: "Data maintenance berhasil diperbarui.",
                        data: {
                            id_maintenance: id_maintenance,
                            id_device: id_device,
                            serial_number_device: serial_number_device,
                            history: history,
                            type: type,
                            updated_by: {
                                id: updated_by,
                                username: updated_by_username,
                            },
                            updated_at: formattedUpdatedAt,
                        },
                    });
                });
            });
        });
    });
};
