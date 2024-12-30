const pool = require('../config/db');
const { format } = require('date-fns');


// Controller untuk mendapatkan installation berdasarkan type device
exports.getInstallationsByDeviceType = (req, res) => {
    const { type } = req.params;

    const query = `
        SELECT 
            i.id_installation,
            i.id_device,
            d.serial_number_device,
            i.tanggal_installasi,
            i.warranty,
            i.lokasi,
            i.mode_unit, 
            i.code_unit,
            i.status,
            i.created_by,
            u.username AS created_by_username,
            i.created_at,
            i.updated_at,
            d.type AS device_type,
            i.keterangan
        FROM installation i
        LEFT JOIN users u ON i.created_by = u.id
        LEFT JOIN device d ON i.id_device = d.id_device
        WHERE d.type = ? AND i.deleted_at IS NULL
    `;

    pool.query(query, [type], (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({
                success: false,
                message: `Gagal mengambil data installation berdasarkan type ${type}.`,
                error: err.message,
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Data installation dengan type device ${type} tidak ditemukan.`,
            });
        }

        const formattedResults = results.map((installation) => {
            const isOffline = installation.status.toLowerCase() === 'offline';
            
            return {
                id_installation: installation.id_installation,
                id_device: installation.id_device,
                serial_number_device: installation.serial_number_device,
                tanggal_installasi: installation.tanggal_installasi 
                    ? format(new Date(installation.tanggal_installasi), 'yyyy-MM-dd') 
                    : null,
                warranty: installation.warranty 
                    ? format(new Date(installation.warranty), 'yyyy-MM-dd') 
                    : null,
                lokasi: isOffline ? null : installation.lokasi,
                mode_unit: isOffline ? null : installation.mode_unit,
                code_unit: isOffline ? null : installation.code_unit,
                status: installation.status,
                created_by: {
                    id: installation.created_by,
                    username: installation.created_by_username,
                },
                created_at: format(new Date(installation.created_at), 'yyyy-MM-dd HH:mm:ss'),
                updated_at: format(new Date(installation.updated_at), 'yyyy-MM-dd HH:mm:ss'),
                device_type: installation.device_type,
                keterangan: installation.keterangan,
            };
        });

        res.status(200).json({
            success: true,
            message: results.length > 0
                ? `Data installation dengan type device ${type} berhasil diambil.`
                : `Tidak ada data installation dengan type device ${type}.`,
            data: formattedResults,
        });
    });
};


// Controller untuk mengambil serial number perangkat berdasarkan tipe
exports.getDeviceSerialNumbersByType = (req, res) => {
    const deviceType = req.params.type;

    const query = `
        SELECT d.id_device, d.serial_number_device
        FROM device d
        WHERE d.deleted_at IS NULL AND d.type = ?
    `;

    pool.query(query, [deviceType], (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({
                success: false,
                message: `Gagal mengambil daftar serial number untuk type '${deviceType}'.`,
                error: err.message,
            });
        }

        res.status(200).json({
            success: true,
            data: results,
        });
    });
};


// Controller untuk mengambil semua serial number perangkat bertipe 'ofa'
exports.getAllDeviceSerialNumbersByOFA = (req, res) => {
    const query = `
        SELECT d.id_device, d.serial_number_device
        FROM device d
        WHERE d.type = 'ofa' AND d.deleted_at IS NULL
    `;

    pool.query(query, (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil daftar serial number untuk tipe 'ofa'.",
                error: err.message,
            });
        }

        res.status(200).json({
            success: true,
            data: results,
        });
    });
};


// Controller untuk mengambil serial number perangkat berdasarkan type dan yang belum memiliki data di installation
exports.getDeviceSerialNumbersForOFA = (req, res) => {
    const query = `
        SELECT d.id_device, d.serial_number_device
        FROM device d
        LEFT JOIN installation i ON d.id_device = i.id_device
        WHERE i.id_device IS NULL AND d.deleted_at IS NULL AND d.type = 'ofa'
    `;

    pool.query(query, (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil daftar serial number untuk type 'ofa'.",
                error: err.message,
            });
        }

        res.status(200).json({
            success: true,
            data: results,
        });
    });
};


// Controller untuk mengambil semua serial number perangkat bertipe 'sdfms'
exports.getAllDeviceSerialNumbersBySDFMS = (req, res) => {
    const query = `
        SELECT d.id_device, d.serial_number_device
        FROM device d
        WHERE d.type = 'SDFMS' AND d.deleted_at IS NULL
    `;

    pool.query(query, (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil daftar serial number untuk tipe 'SDFMS'.",
                error: err.message,
            });
        }

        res.status(200).json({
            success: true,
            data: results,
        });
    });
};

// Controller untuk mengambil serial number perangkat berdasarkan type dan yang belum memiliki data di installation
exports.getDeviceSerialNumbersForSDFMS = (req, res) => {
    const query = `
        SELECT d.id_device, d.serial_number_device
        FROM device d
        LEFT JOIN installation i ON d.id_device = i.id_device
        WHERE i.id_device IS NULL AND d.deleted_at IS NULL AND d.type = 'SDFMS'
    `;

    pool.query(query, (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil daftar serial number untuk type 'SDFMS'.",
                error: err.message,
            });
        }

        res.status(200).json({
            success: true,
            data: results,
        });
    });
};


exports.getAllDeviceSerialNumbersByMANTULGRADER = (req, res) => {
    const query = `
        SELECT d.id_device, d.serial_number_device
        FROM device d
        WHERE d.type = 'MANTULGRADER' AND d.deleted_at IS NULL
    `;

    pool.query(query, (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil daftar serial number untuk tipe 'MANTULGRADER'.",
                error: err.message,
            });
        }

        res.status(200).json({
            success: true,
            data: results,
        });
    });
};

// Controller untuk mengambil serial number perangkat berdasarkan type dan yang belum memiliki data di installation
exports.getDeviceSerialNumbersForMANTULGRADER= (req, res) => {
    const query = `
        SELECT d.id_device, d.serial_number_device
        FROM device d
        LEFT JOIN installation i ON d.id_device = i.id_device
        WHERE i.id_device IS NULL AND d.deleted_at IS NULL AND d.type = 'MANTULGRADER'
    `;

    pool.query(query, (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil daftar serial number untuk type 'MANTULGRADER'.",
                error: err.message,
            });
        }

        res.status(200).json({
            success: true,
            data: results,
        });
    });
};

exports.getAllDeviceSerialNumbersBySAFELIGHT = (req, res) => {
    const query = `
        SELECT d.id_device, d.serial_number_device
        FROM device d
        WHERE d.type = 'SAFELIGHT' AND d.deleted_at IS NULL
    `;

    pool.query(query, (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil daftar serial number untuk tipe 'SAFELIGHT.",
                error: err.message,
            });
        }

        res.status(200).json({
            success: true,
            data: results,
        });
    });
};

// Controller untuk mengambil serial number perangkat berdasarkan type dan yang belum memiliki data di installation
exports.getDeviceSerialNumbersForSAFELIGHT = (req, res) => {
    const query = `
        SELECT d.id_device, d.serial_number_device
        FROM device d
        LEFT JOIN installation i ON d.id_device = i.id_device
        WHERE i.id_device IS NULL AND d.deleted_at IS NULL AND d.type = 'SAFELIGHT'
    `;

    pool.query(query, (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil daftar serial number untuk type 'SAFELIGHT'.",
                error: err.message,
            });
        }

        res.status(200).json({
            success: true,
            data: results,
        });
    });
};

    
// Controller untuk menambahkan installation
exports.addInstallation = (req, res) => {
    const {
        id_device,
        tanggal_installasi,
        warranty,
        lokasi,
        mode_unit,
        code_unit,
        status,
        keterangan, 
    } = req.body;

    const created_by = req.user?.id;

    if (!id_device || !tanggal_installasi || !warranty || !lokasi || !mode_unit || !code_unit || !status) {
        return res.status(400).json({
            success: false,
            message: "Semua field harus diisi.",
        });
    }

    const formattedTanggalInstallasi = format(new Date(tanggal_installasi), 'yyyy-MM-dd');
    const formattedWarranty = format(new Date(warranty), 'yyyy-MM-dd');
    const formattedCreatedAt = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const formattedUpdatedAt = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

    const queryCheckDevice = `
        SELECT id_device 
        FROM device 
        WHERE id_device = ?
    `;

    pool.query(queryCheckDevice, [id_device], (err, checkResult) => {
        if (err) {
            console.error("Database Error (Check Device):", err);
            return res.status(500).json({
                success: false,
                message: "Gagal memeriksa data device.",
                error: err.message,
            });
        }

        if (checkResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Device dengan ID tersebut tidak ditemukan.",
            });
        }

        const queryGetLastId = `
            SELECT id_installation 
            FROM installation 
            ORDER BY id_installation DESC 
            LIMIT 1
        `;

        pool.query(queryGetLastId, (err, lastIdResult) => {
            if (err) {
                console.error("Database Error (Get Last ID):", err);
                return res.status(500).json({
                    success: false,
                    message: "Gagal mendapatkan ID terakhir untuk installation.",
                    error: err.message,
                });
            }

            let nextId = 'IN0000001';

            if (lastIdResult.length > 0) {
                const lastId = lastIdResult[0].id_installation;
                const numericPart = parseInt(lastId.slice(2), 10);
                const nextNumericPart = numericPart + 1;

                if (nextNumericPart <= 9999999) {
                    nextId = `IN${nextNumericPart.toString().padStart(7, '0')}`;
                } else {
                    return res.status(400).json({
                        success: false,
                        message: "Batas maksimal ID instalasi tercapai (IN9999999).",
                    });
                }
            }

            const queryInsert = `
                INSERT INTO installation (
                    id_installation, id_device, tanggal_installasi, warranty, lokasi, mode_unit, code_unit, status, created_by, created_at, updated_at, keterangan
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                nextId,
                id_device,
                formattedTanggalInstallasi,
                formattedWarranty,
                lokasi,
                mode_unit,
                code_unit,
                status,
                created_by,
                formattedCreatedAt,
                formattedUpdatedAt,
                keterangan || null, 
            ];

            pool.query(queryInsert, values, (err, result) => {
                if (err) {
                    console.error("Database Error (Insert Installation):", err);
                    return res.status(500).json({
                        success: false,
                        message: "Gagal menambahkan installation.",
                        error: err.message,
                    });
                }
                if (status === 'offline') {
                    const queryUpdateDevice = `
                        UPDATE device 
                        SET status = 'repair', lokasi = NULL, mode_unit = NULL, code_unit = NULL 
                        WHERE id_device = ?
                    `;
                    pool.query(queryUpdateDevice, [id_device], (err) => {
                        if (err) {
                            console.error("Database Error (Update Device):", err);
                            return res.status(500).json({
                                success: false,
                                message: "Gagal memperbarui status perangkat.",
                                error: err.message,
                            });
                        }
                    });
                }

                const queryGetSerialNumber = `
                    SELECT serial_number_device 
                    FROM device 
                    WHERE id_device = ?
                `;

                pool.query(queryGetSerialNumber, [id_device], (err, serialResult) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Gagal mendapatkan serial number device.",
                            error: err.message,
                        });
                    }

                    const serial_number_device = serialResult[0]?.serial_number_device || null;

                    const queryDeviceCount = `
                    SELECT COUNT(*) AS total_devices
                    FROM device
                    WHERE deleted_at IS NULL
                `;

                    pool.query(queryDeviceCount, (err6, deviceCountResults) => {
                        if (err6) return handleError(res, err6);

                        const totalDevices = deviceCountResults[0]?.total_devices || 0;

                        res.status(201).json({
                            success: true,
                            message: "Installation berhasil ditambahkan.",
                            data: {
                                id_installation: nextId,
                                id_device,
                                serial_number_device,
                                tanggal_installasi: formattedTanggalInstallasi,
                                warranty: formattedWarranty,
                                lokasi,
                                mode_unit,
                                code_unit,
                                status,
                                created_by: {
                                    id: created_by,
                                    username: req.user.username,
                                },
                                created_at: formattedCreatedAt,
                                updated_at: formattedUpdatedAt,
                                keterangan,
                                totalDevices, 
                            },
                        });
                    });
                });
            });
        });
    });
};


exports.updateInstallationById = (req, res) => {
    const { id_installation } = req.params;
    const {
        id_device,
        tanggal_installasi,
        warranty,
        lokasi,
        mode_unit,
        code_unit,
        status,
        keterangan,
    } = req.body;

    if (!id_device || !status) {
        return res.status(400).json({
            success: false,
            message: "ID Device dan Status wajib diisi.",
        });
    }

    const formattedTanggalInstallasi = tanggal_installasi
        ? format(new Date(tanggal_installasi), 'yyyy-MM-dd')
        : null;
    const formattedWarranty = warranty
        ? format(new Date(warranty), 'yyyy-MM-dd')
        : null;
    const formattedUpdatedAt = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

    const updatedLokasi = status.toLowerCase() === 'offline' ? null : lokasi;
    const updatedModeUnit = status.toLowerCase() === 'offline' ? null : mode_unit;
    const updatedCodeUnit = status.toLowerCase() === 'offline' ? null : code_unit;
    const updatedTanggalInstallasi =
        status.toLowerCase() === 'offline' ? null : formattedTanggalInstallasi;
    const updatedWarranty = status.toLowerCase() === 'offline' ? null : formattedWarranty;

    // Query Update Installation
    const queryUpdateInstallation = `
        UPDATE installation
        SET 
            id_device = ?,
            tanggal_installasi = ?,
            warranty = ?,
            lokasi = ?,
            mode_unit = ?,
            code_unit = ?,
            status = ?,
            updated_at = ?,
            keterangan = ? 
        WHERE id_installation = ? AND deleted_at IS NULL
    `;

    const valuesInstallation = [
        id_device,
        updatedTanggalInstallasi,
        updatedWarranty,
        updatedLokasi,
        updatedModeUnit,
        updatedCodeUnit,
        status,
        formattedUpdatedAt,
        keterangan || null,
        id_installation,
    ];

    pool.query(queryUpdateInstallation, valuesInstallation, (err, result) => {
        if (err) {
            console.error("Database Error (Update Installation):", err);
            return res.status(500).json({
                success: false,
                message: "Gagal memperbarui installation.",
                error: err.message,
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: `Installation dengan ID ${id_installation} tidak ditemukan atau telah dihapus.`,
            });
        }

        if (status.toLowerCase() === 'offline') {
            const queryUpdateDevice = `
                UPDATE device
                SET status = 'repair'
                WHERE id_device = ? AND status = 'terpasang'
            `;

            pool.query(queryUpdateDevice, [id_device], (err2, result2) => {
                if (err2) {
                    console.error("Database Error (Update Device Status):", err2);
                    return res.status(500).json({
                        success: false,
                        message: "Gagal memperbarui status perangkat.",
                        error: err2.message,
                    });
                }

                const queryGetSerialNumber = `
                    SELECT serial_number_device 
                    FROM device
                    WHERE id_device = ?
                `;

                pool.query(queryGetSerialNumber, [id_device], (err3, serialResult) => {
                    if (err3) {
                        return res.status(500).json({
                            success: false,
                            message: "Gagal mendapatkan serial number device.",
                            error: err3.message,
                        });
                    }

                    const serial_number_device = serialResult[0]?.serial_number_device || null;

                    res.status(200).json({
                        success: true,
                        message: "Installation berhasil diperbarui, dan status perangkat diubah menjadi 'repair'.",
                        data: {
                            id_installation,
                            id_device,
                            serial_number_device,
                            tanggal_installasi: updatedTanggalInstallasi,
                            warranty: updatedWarranty,
                            lokasi: updatedLokasi,
                            mode_unit: updatedModeUnit,
                            code_unit: updatedCodeUnit,
                            status,
                            updated_at: formattedUpdatedAt,
                            keterangan,
                        },
                    });
                });
            });

        } else if (status.toLowerCase() === 'online') {
            const queryUpdateDevice = `
                UPDATE device
                SET status = 'terpasang'
                WHERE id_device = ? AND status = 'repair'
            `;

            pool.query(queryUpdateDevice, [id_device], (err2, result2) => {
                if (err2) {
                    console.error("Database Error (Update Device Status):", err2);
                    return res.status(500).json({
                        success: false,
                        message: "Gagal memperbarui status perangkat.",
                        error: err2.message,
                    });
                }

                const queryGetSerialNumber = `
                    SELECT serial_number_device 
                    FROM device
                    WHERE id_device = ?
                `;

                pool.query(queryGetSerialNumber, [id_device], (err3, serialResult) => {
                    if (err3) {
                        return res.status(500).json({
                            success: false,
                            message: "Gagal mendapatkan serial number device.",
                            error: err3.message,
                        });
                    }

                    const serial_number_device = serialResult[0]?.serial_number_device || null;

                    res.status(200).json({
                        success: true,
                        message: "Installation berhasil diperbarui, dan status perangkat diubah menjadi 'terpasang'.",
                        data: {
                            id_installation,
                            id_device,
                            serial_number_device,
                            tanggal_installasi: updatedTanggalInstallasi,
                            warranty: updatedWarranty,
                            lokasi: updatedLokasi,
                            mode_unit: updatedModeUnit,
                            code_unit: updatedCodeUnit,
                            status,
                            updated_at: formattedUpdatedAt,
                            keterangan,
                        },
                    });
                });
            });
        } else {
            const queryGetSerialNumber = `
                SELECT serial_number_device 
                FROM device
                WHERE id_device = ?
            `;

            pool.query(queryGetSerialNumber, [id_device], (err3, serialResult) => {
                if (err3) {
                    return res.status(500).json({
                        success: false,
                        message: "Gagal mendapatkan serial number device.",
                        error: err3.message,
                    });
                }

                const serial_number_device = serialResult[0]?.serial_number_device || null;

                res.status(200).json({
                    success: true,
                    message: "Installation berhasil diperbarui.",
                    data: {
                        id_installation,
                        id_device,
                        serial_number_device,
                        tanggal_installasi: updatedTanggalInstallasi,
                        warranty: updatedWarranty,
                        lokasi: updatedLokasi,
                        mode_unit: updatedModeUnit,
                        code_unit: updatedCodeUnit,
                        status,
                        updated_at: formattedUpdatedAt,
                        keterangan,
                    },
                });
            });
        }
    });
};
