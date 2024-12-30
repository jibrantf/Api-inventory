const pool = require('../config/db');

// Mengambil semua barang beserta kategorinya
exports.getAllBarang = (req, res) => {
    const queryStr = `
        SELECT b.id_barang, b.part_number, b.nama_barang, b.stok, b.satuan, b.keterangan, k.id_kategori, k.nama_kategori
        FROM barang b
        JOIN kategori k ON b.id_kategori = k.id_kategori 
        WHERE b.deleted_at IS NULL
        ORDER BY b.id_barang ASC`;

    pool.query(queryStr, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                "success": false,
                "message": "Database query error",
                "error": err.sqlMessage
            });
        }

        const filteredResult = result.map(item => ({
            id_barang: item.id_barang,
            part_number: item.part_number,
            nama_barang: item.nama_barang,
            id_kategori: item.id_kategori,
            nama_kategori: item.nama_kategori,
            stok: item.stok,
            satuan: item.satuan,
            keterangan: item.keterangan
        }));

        res.status(200).json({
            "success": true,
            "message": "Success menampilkan data barang",
            "data": filteredResult
        });
    });
};

// Mengambil barang berdasarkan ID
exports.getBarangById = (req, res) => {
    const { id_barang } = req.params;

    const queryStr = `
        SELECT b.id_barang, b.part_number, b.nama_barang, b.stok, b.satuan, b.keterangan, k.nama_kategori, 
               b.created_at, u.username AS created_by
        FROM barang b
        JOIN kategori k ON b.id_kategori = k.id_kategori
        LEFT JOIN users u ON b.created_by = u.id
        WHERE b.id_barang = ? AND b.deleted_at IS NULL
    `;

    pool.query(queryStr, [id_barang], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({
                success: false,
                message: "Terjadi kesalahan pada query database",
                error: err.sqlMessage
            });
        }

        if (!result || result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Barang tidak ditemukan"
            });
        }

        const barang = result[0];

        const createdAt = new Date(barang.created_at);
        const formattedDate = createdAt.toLocaleString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }).replace(',', ''); 

        return res.status(200).json({
            success: true,
            message: "Berhasil menampilkan data barang",
            data: {
                id_barang: barang.id_barang,
                part_number: barang.part_number,
                nama_barang: barang.nama_barang,
                kategori: barang.nama_kategori,
                stok: barang.stok,
                satuan: barang.satuan,
                keterangan: barang.keterangan,
                created_at: formattedDate,
                created_by: barang.created_by
            }
        });
    });
};


// Mengambil barang berdasarkan ID kategori
exports.getBarangByKategoriId = (req, res) => {
    const { id_kategori } = req.params;

    const checkCategoryQuery = `
        SELECT id_kategori, nama_kategori
        FROM kategori
        WHERE id_kategori = ? AND deleted_at IS NULL`;

    pool.query(checkCategoryQuery, [id_kategori], (err, categoryResults) => {
        if (err) {
            console.error('Error saat memeriksa kategori:', err);
            return res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan pada query database',
                error: err.sqlMessage
            });
        }
        if (categoryResults.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Kategori dengan ID ${id_kategori} tidak ditemukan atau sudah dihapus.`
            });
        }

        const queryStr = `
            SELECT b.id_barang, b.part_number, b.nama_barang
            FROM barang b
            WHERE b.id_kategori = ? AND b.deleted_at IS NULL`;

        pool.query(queryStr, [id_kategori], (err, results) => {
            if (err) {
                console.error('Error saat mengambil data barang berdasarkan kategori ID:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Terjadi kesalahan pada query database',
                    error: err.sqlMessage
                });
            }

            if (results.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: `Tidak terdapat barang dalam kategori dengan ID ${id_kategori}.`,
                    data: []
                });
            }

            const formattedResults = results.map(item => ({
                id_barang: item.id_barang,
                part_number: item.part_number,
                nama_barang: item.nama_barang
            }));

            res.status(200).json({
                success: true,
                message: `Berhasil menampilkan barang dalam kategori dengan ID ${id_kategori}`,
                data: formattedResults
            });
        });
    });
};





// Menambahkan barang baru
exports.createBarang = (req, res) => {
    const { part_number, nama_barang, stok, satuan, keterangan, nama_kategori } = req.body;

    if (!part_number || !nama_barang || stok === undefined || !satuan || !nama_kategori) {
        return res.status(400).json({
            success: false,
            message: "Kode barang, nama barang, stok, satuan, dan nama_kategori harus diisi."
        });
    }

    const validSatuan = ['pcs', 'box', 'roll', 'meter', 'pack'];
    if (!validSatuan.includes(satuan)) {
        return res.status(400).json({
            success: false,
            message: "Satuan tidak valid."
        });
    }

    if (!req.user || !req.user.id) {
        return res.status(401).json({
            success: false,
            message: "Pengguna tidak terautentikasi dengan benar"
        });
    }

    const checkQuery = 'SELECT * FROM barang WHERE part_number = ?';
    pool.query(checkQuery, [part_number], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Error memeriksa kode barang",
                error: err.sqlMessage
            });
        }

        if (result.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Kode barang sudah terpakai, masukkan kode lain."
            });
        }

        const getCategoryIdQuery = 'SELECT id_kategori FROM kategori WHERE nama_kategori = ?';
        pool.query(getCategoryIdQuery, [nama_kategori], (err, categoryResult) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Error mengambil ID kategori",
                    error: err.sqlMessage
                });
            }

            if (categoryResult.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Nama kategori tidak ditemukan."
                });
            }

            const id_kategori = categoryResult[0].id_kategori;

                const lastIdQuery = 'SELECT id_barang FROM barang ORDER BY id_barang DESC LIMIT 1';
                pool.query(lastIdQuery, (err, lastIdResult) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            success: false,
                            message: "Error mengambil ID terakhir",
                            error: err.sqlMessage
                        });
                    }

                    let id_barang = 'B000000001'; 
                    if (lastIdResult.length > 0) {
                        const lastId = lastIdResult[0].id_barang; 
                        const lastIdNumber = parseInt(lastId.substring(1), 10);
                        const newIdNumber = lastIdNumber + 1; 
                        id_barang = 'B' + newIdNumber.toString().padStart(9, '0'); 
                    }

                    const getUserQuery = 'SELECT username FROM users WHERE id = ?';
                    pool.query(getUserQuery, [req.user.id], (err, userResult) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({
                                success: false,
                                message: "Error mengambil data pengguna",
                                error: err.sqlMessage
                            });
                        }

                        const username = userResult.length > 0 ? userResult[0].username : "Unknown";

                        const queryStr = `
                            INSERT INTO barang (id_barang, part_number, nama_barang, stok, satuan, keterangan, id_kategori, created_at, updated_at, created_by) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)
                        `;

                        const values = [id_barang, part_number, nama_barang, stok, satuan, keterangan || null, id_kategori, req.user.id];

                        pool.query(queryStr, values, (err, result) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).json({
                                    success: false,
                                    message: "Error menambahkan barang",
                                    error: err.sqlMessage
                                });
                            }

                            res.status(201).json({
                                success: true,
                                message: "Barang berhasil ditambahkan",
                                data: {
                                    id_barang,
                                    part_number,
                                    nama_barang,
                                    nama_kategori,
                                    stok,
                                    satuan,
                                    keterangan,
                                    created_by_id: req.user.id,
                                    created_by_username: username,
                                    created_at: new Date().toLocaleString('id-ID', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                    })
                                }
                            });
                        });
                    });
                });
        });
    });
};




// Memperbarui barang berdasarkan id_barang
exports.updateBarangById = (req, res) => {
    const { id_barang } = req.params;
    const { part_number, nama_kategori, nama_barang, stok, satuan, keterangan } = req.body;

    console.log('Data yang diterima:', req.body);

    if (!part_number || stok === undefined || !satuan || !nama_kategori || !nama_barang) {
        return res.status(400).json({
            success: false,
            message: "Kode barang, stok, satuan, nama_kategori, dan nama_barang harus diisi."
        });
    }

    const validSatuan = ['pcs', 'box', 'roll', 'meter', 'pack'];
    if (!validSatuan.includes(satuan)) {
        return res.status(400).json({
            success: false,
            message: "Satuan tidak ada."
        });
    }

    const getKategoriQuery = 'SELECT id_kategori FROM kategori WHERE nama_kategori = ?';
    pool.query(getKategoriQuery, [nama_kategori], (err, kategoriResult) => {
        if (err) {
            console.error("Kesalahan Query Kategori:", err);
            return res.status(500).json({
                success: false,
                message: "Error memeriksa kategori",
                error: err.sqlMessage
            });
        }

        if (kategoriResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Kategori tidak ditemukan"
            });
        }

        const id_kategori = kategoriResult[0].id_kategori;

        const queryStr = `
            UPDATE barang 
            SET part_number = ?, nama_barang = ?, stok = ?, satuan = ?, keterangan = ?, id_kategori = ?, created_by = ? 
            WHERE id_barang = ?
        `;

        const values = [part_number, nama_barang, stok, satuan, keterangan || null, id_kategori, req.user.id, id_barang];

        pool.query(queryStr, values, (err, result) => {
            if (err) {
                console.error("Kesalahan Query:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error memperbarui barang",
                    error: err.sqlMessage
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Barang tidak ditemukan"
                });
            }

            res.status(200).json({
                success: true,
                message: "Barang berhasil diperbarui",
                data: {
                    id_barang,
                    part_number,
                    nama_barang,
                    nama_kategori,
                    stok,
                    satuan,
                    keterangan
                }
            });
        });
    });
};





// Menghapus barang berdasarkan id_barang
exports.deleteBarang = (req, res) => {
    const { id_barang } = req.params;

    pool.query('SELECT * FROM barang WHERE id_barang = ? AND deleted_at IS NULL', [id_barang], (err, result) => {
        if (err) {
            console.error('Error memeriksa barang:', err);
            return res.status(500).json({
                success: false,
                message: 'Error memeriksa barang',
                error: err.sqlMessage
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Barang tidak ditemukan'
            });
        }

        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error mendapatkan koneksi:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error mendapatkan koneksi',
                    error: err.message
                });
            }

            connection.beginTransaction(err => {
                if (err) {
                    console.error('Error memulai transaksi:', err);
                    connection.release();
                    return res.status(500).json({
                        success: false,
                        message: 'Error memulai transaksi',
                        error: err.message
                    });
                }

                const deleteBarangQuery = 'UPDATE barang SET deleted_at = NOW() WHERE id_barang = ?';
                connection.query(deleteBarangQuery, [id_barang], (err, result) => {
                    if (err) {
                        console.error('Error menghapus barang:', err);
                        return connection.rollback(() => {
                            connection.release();
                            res.status(500).json({
                                success: false,
                                message: 'Error menghapus barang',
                                error: err.sqlMessage
                            });
                        });
                    }

                    const deleteBarangMasukQuery = 'DELETE FROM barang_masuk WHERE id_barang = ?';
                    const deleteBarangKeluarQuery = 'DELETE FROM barang_keluar WHERE id_barang = ?';
                    const deleteBarangRusakQuery = 'DELETE FROM barang_rusak WHERE id_barang = ?';

                    connection.query(deleteBarangMasukQuery, [id_barang], (err, result) => {
                        if (err) {
                            console.error('Error menghapus data barang masuk:', err);
                            return connection.rollback(() => {
                                connection.release();
                                res.status(500).json({
                                    success: false,
                                    message: 'Error menghapus barang masuk',
                                    error: err.sqlMessage
                                });
                            });
                        }

                        connection.query(deleteBarangKeluarQuery, [id_barang], (err, result) => {
                            if (err) {
                                console.error('Error menghapus data barang keluar:', err);
                                return connection.rollback(() => {
                                    connection.release();
                                    res.status(500).json({
                                        success: false,
                                        message: 'Error menghapus barang keluar',
                                        error: err.sqlMessage
                                    });
                                });
                            }

                            connection.query(deleteBarangRusakQuery, [id_barang], (err, result) => {
                                if (err) {
                                    console.error('Error menghapus data barang rusak:', err);
                                    return connection.rollback(() => {
                                        connection.release();
                                        res.status(500).json({
                                            success: false,
                                            message: 'Error menghapus barang rusak',
                                            error: err.sqlMessage
                                        });
                                    });
                                }

                                connection.commit(err => {
                                    if (err) {
                                        console.error('Error melakukan commit transaksi:', err);
                                        return connection.rollback(() => {
                                            connection.release();
                                            res.status(500).json({
                                                success: false,
                                                message: 'Error melakukan commit transaksi',
                                                error: err.message
                                            });
                                        });
                                    }

                                    connection.release();
                                    res.status(200).json({
                                        success: true,
                                        message: 'Barang dan data terkait berhasil dihapus'
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};

