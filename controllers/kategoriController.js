const pool = require('../config/db');

// Mendapatkan semua kategori
exports.getKategori = (req, res) => {
    const queryStr = `
        SELECT id_kategori, nama_kategori 
        FROM kategori 
        WHERE deleted_at IS NULL 
        ORDER BY id_kategori ASC
    `;

    pool.query(queryStr, (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({
                success: false,
                message: "Terjadi kesalahan saat melakukan query ke database",
                error: err.sqlMessage
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                success: true,
                message: "Tidak ada kategori ditemukan",
                data: []
            });
        }

        res.status(200).json({
            success: true,
            message: "Data kategori berhasil ditampilkan",
            data: result
        });
    });
};


// Mendapatkan detail kategori berdasarkan id_kategori
exports.getKategoriById = (req, res) => {
    const { id_kategori } = req.params;

    const queryStr = `
        SELECT k.id_kategori, k.nama_kategori, k.created_at, u.username AS created_by 
        FROM kategori k
        LEFT JOIN users u ON k.created_by = u.id
        WHERE k.id_kategori = ? AND k.deleted_at IS NULL
    `;

    pool.query(queryStr, [id_kategori], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Terjadi kesalahan pada server", error: err });
        }

        if (!result || result.length === 0) {
            return res.status(404).json({ message: "Kategori tidak ditemukan" });
        }

        if (!req.user || !req.user.role) {
            return res.status(401).json({ message: "Pengguna tidak terautentikasi dengan benar" });
        }

        const kategori = result[0];

        const createdAt = new Date(kategori.created_at);

        const formattedDate = createdAt.toLocaleString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }).replace(',', '');

        kategori.created_at = formattedDate;

        return res.status(200).json({ kategori });
    });
};









// Fungsi untuk mendapatkan ID kategori berikutnya
const getNextIdKategori = (callback) => {
    const query = 'SELECT id_kategori FROM kategori ORDER BY id_kategori DESC LIMIT 1';

    pool.query(query, (err, results) => {
        if (err) {
            console.error('Error saat mengambil ID kategori terakhir:', err);
            return callback(err, null);
        }

        const lastId = results.length > 0 ? results[0].id_kategori : null;
        const nextId = lastId ? `K${(parseInt(lastId.slice(1)) + 1).toString().padStart(3, '0')}` : 'K001';

        callback(null, nextId);
    });
};


// Menambahkan kategori
exports.addKategori = (req, res) => {
    const { nama_kategori } = req.body;

    if (!nama_kategori) {
        return res.status(400).json({
            success: false,
            message: "Nama kategori harus diisi."
        });
    }

    if (!req.user || !req.user.id) {
        return res.status(401).json({
            success: false,
            message: "Pengguna tidak terautentikasi dengan benar"
        });
    }

    const queryStrCheck = `SELECT nama_kategori FROM kategori WHERE nama_kategori = ?`;

    pool.query(queryStrCheck, [nama_kategori], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Error memeriksa nama kategori",
                error: err.sqlMessage
            });
        }

        if (result.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Nama kategori sudah ada, gunakan nama lain."
            });
        }

        const queryStrLastId = `
            SELECT id_kategori FROM kategori
            ORDER BY id_kategori DESC LIMIT 1
        `;

        pool.query(queryStrLastId, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: 'Error mendapatkan ID kategori terakhir',
                    error: err.sqlMessage
                });
            }

            let newId = 'K000000001';
            if (result.length > 0) {
                const lastId = result[0].id_kategori;
                const lastNumber = parseInt(lastId.replace('K', ''), 10); 
                newId = 'K' + (lastNumber + 1).toString().padStart(9, '0'); 
            }
            

            const queryStrUsername = `
                SELECT username FROM users WHERE id = ?
            `;

            pool.query(queryStrUsername, [req.user.id], (err, usernameResult) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error mendapatkan username pengguna',
                        error: err.sqlMessage
                    });
                }

                if (usernameResult.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "Pengguna tidak ditemukan."
                    });
                }

                const username = usernameResult[0].username;

                const queryStrInsert = `
                    INSERT INTO kategori (id_kategori, nama_kategori, created_by, created_at) 
                    VALUES (?, ?, ?, NOW())
                `;

                pool.query(queryStrInsert, [newId, nama_kategori, req.user.id], (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            success: false,
                            message: "Error menambahkan kategori",
                            error: err.sqlMessage
                        });
                    }

                    res.status(201).json({
                        success: true,
                        message: "Kategori berhasil ditambahkan",
                        data: {
                            id_kategori: newId,
                            nama_kategori,
                            created_at: new Date().toLocaleString('id-ID', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                            }),
                            created_by_id: req.user.id,
                            created_by_username: username
                        }
                    });
                });
            });
        });
    });
};





// Mengupdate kategori
exports.updateKategori = (req, res) => {
    const { id_kategori } = req.params;
    const { nama_kategori } = req.body;

    if (!nama_kategori) {
        return res.status(400).json({
            success: false,
            message: "Nama kategori harus diisi"
        });
    }

    const queryStr = `
        UPDATE kategori 
        SET nama_kategori = ?, created_by = ? 
        WHERE id_kategori = ?
    `;

    pool.query(queryStr, [nama_kategori, req.user.id, id_kategori], (err, result) => {
        if (err) {
            console.error("Kesalahan Query:", err);
            return res.status(500).json({
                success: false,
                message: "Error mengupdate kategori",
                error: err.sqlMessage
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Kategori tidak ditemukan",
            });
        }

        res.status(200).json({
            success: true,
            message: "Kategori berhasil diperbarui",
            data: {
                id_kategori,
                nama_kategori
            }
        });
    });
};



// Menghapus kategori
exports.deleteKategori = (req, res) => {
    const { id_kategori } = req.params;
    
    pool.getConnection((err, conn) => {
        if (err) {
            console.error('Error mendapatkan koneksi:', err);
            return res.status(500).json({
                success: false,
                message: "Gagal mendapatkan koneksi",
                error: err.sqlMessage
            });
        }

        conn.beginTransaction((err) => {
            if (err) {
                console.error('Error mulai transaksi:', err);
                return res.status(500).json({
                    success: false,
                    message: "Gagal memulai transaksi",
                    error: err.sqlMessage
                });
            }

            const updateTransaksiQuery = `
                UPDATE barang_masuk 
                SET deleted_at = CURRENT_TIMESTAMP 
                WHERE id_barang IN (SELECT id_barang FROM barang WHERE id_kategori = ?);
            `;
            
            conn.query(updateTransaksiQuery, [id_kategori], (err) => {
                if (err) {
                    return conn.rollback(() => {
                        console.error('Error mengupdate transaksi barang masuk:', err);
                        return res.status(500).json({
                            success: false,
                            message: "Error mengupdate transaksi barang masuk",
                            error: err.sqlMessage
                        });
                    });
                }

                const updateTransaksiKeluarQuery = `
                    UPDATE barang_keluar 
                    SET deleted_at = CURRENT_TIMESTAMP 
                    WHERE id_barang IN (SELECT id_barang FROM barang WHERE id_kategori = ?);
                `;
                
                conn.query(updateTransaksiKeluarQuery, [id_kategori], (err) => {
                    if (err) {
                        return conn.rollback(() => {
                            console.error('Error mengupdate transaksi barang keluar:', err);
                            return res.status(500).json({
                                success: false,
                                message: "Error mengupdate transaksi barang keluar",
                                error: err.sqlMessage
                            });
                        });
                    }

                    const updateTransaksiRusakQuery = `
                        UPDATE barang_rusak 
                        SET deleted_at = CURRENT_TIMESTAMP 
                        WHERE id_barang IN (SELECT id_barang FROM barang WHERE id_kategori = ?);
                    `;
                    
                    conn.query(updateTransaksiRusakQuery, [id_kategori], (err) => {
                        if (err) {
                            return conn.rollback(() => {
                                console.error('Error mengupdate transaksi barang rusak:', err);
                                return res.status(500).json({
                                    success: false,
                                    message: "Error mengupdate transaksi barang rusak",
                                    error: err.sqlMessage
                                });
                            });
                        }

                        const updateBarangQuery = `
                            UPDATE barang 
                            SET deleted_at = CURRENT_TIMESTAMP 
                            WHERE id_kategori = ?;
                        `;
                        
                        conn.query(updateBarangQuery, [id_kategori], (err) => {
                            if (err) {
                                return conn.rollback(() => {
                                    console.error('Error mengupdate barang:', err);
                                    return res.status(500).json({
                                        success: false,
                                        message: "Error mengupdate barang",
                                        error: err.sqlMessage
                                    });
                                });
                            }

                            const updateKategoriQuery = `
                                UPDATE kategori SET deleted_at = CURRENT_TIMESTAMP WHERE id_kategori = ?;
                            `;
                            
                            conn.query(updateKategoriQuery, [id_kategori], (err, result) => {
                                if (err) {
                                    return conn.rollback(() => {
                                        console.error('Error mengupdate kategori:', err);
                                        return res.status(500).json({
                                            success: false,
                                            message: "Error mengupdate kategori",
                                            error: err.sqlMessage
                                        });
                                    });
                                }

                                if (result.affectedRows === 0) {
                                    return conn.rollback(() => {
                                        return res.status(404).json({
                                            success: false,
                                            message: "Kategori tidak ditemukan"
                                        });
                                    });
                                }

                                conn.commit((err) => {
                                    if (err) {
                                        return conn.rollback(() => {
                                            console.error('Error saat commit transaksi:', err);
                                            return res.status(500).json({
                                                success: false,
                                                message: "Error saat commit transaksi",
                                                error: err.sqlMessage
                                            });
                                        });
                                    }

 
                                    res.status(200).json({
                                        success: true,
                                        message: "Kategori dan semua data terkait berhasil dihapus"
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

