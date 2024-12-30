
const pool = require('../config/db');
const { format } = require('date-fns');


// Mendapatkan semua barang keluar
exports.getBarangKeluar = (req, res) => {
    const queryStr = `
        SELECT bk.id_keluar, b.part_number, b.id_barang, b.nama_barang, 
               k.id_kategori, k.nama_kategori, 
               bk.jumlah, bk.keterangan, bk.created_at, u.id AS user_id, u.username AS username
        FROM barang_keluar bk
        JOIN barang b ON bk.id_barang = b.id_barang
        JOIN kategori k ON b.id_kategori = k.id_kategori
        LEFT JOIN users u ON bk.created_by = u.id
        WHERE bk.deleted_at IS NULL
        ORDER BY bk.id_keluar ASC`;

    pool.query(queryStr, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: 'Database query error',
                error: err.sqlMessage
            });
        }

        const formattedResult = result.map(item => ({
            id_keluar: item.id_keluar,
            part_number: item.part_number,
            id_barang: item.id_barang,
            nama_barang: item.nama_barang,
            id_kategori: item.id_kategori,
            nama_kategori: item.nama_kategori,
            jumlah: item.jumlah,
            keterangan: item.keterangan,
            created_by: {
                id: item.user_id, 
                username: item.username 
            },
            created_at: item.created_at ? format(new Date(item.created_at), 'yyyy-MM-dd HH:mm:ss') : null
        }));

        res.status(200).json({
            success: true,
            message: 'Data barang keluar berhasil diambil',
            data: formattedResult
        });
    });
};


// Mendapatkan detail barang keluar berdasarkan ID
exports.getBarangKeluarById = (req, res) => {
    const { id_keluar } = req.params;

    const queryStr = `
        SELECT bk.id_keluar, k.nama_kategori, b.nama_barang, bk.jumlah, bk.keterangan, 
               bk.created_at, u.id AS user_id, u.username AS created_by
        FROM barang_keluar bk
        JOIN barang b ON bk.id_barang = b.id_barang
        JOIN kategori k ON b.id_kategori = k.id_kategori
        LEFT JOIN users u ON bk.created_by = u.id
        WHERE bk.id_keluar = ? AND bk.deleted_at IS NULL
    `;

    pool.query(queryStr, [id_keluar], (err, result) => {
        if (err) {
            console.error('Error saat mengambil data barang keluar:', err);
            return res.status(500).json({
                success: false,
                message: "Terjadi kesalahan pada query database",
                error: err.sqlMessage
            });
        }

        if (!result || result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Barang keluar tidak ditemukan"
            });
        }

        const data = result[0];

        let formattedDate = 'Tanggal tidak tersedia';
        if (data.created_at) {
            try {
                formattedDate = format(new Date(data.created_at), 'yyyy-MM-dd HH:mm:ss'); 
            } catch (error) {
                formattedDate = 'Tanggal tidak valid';
            }
        }

        console.log('Data yang diterima:', data);

        return res.status(200).json({
            success: true,
            message: "Detail barang keluar berhasil diambil",
            data: {
                id_keluar: data.id_keluar,
                nama_kategori: data.nama_kategori,
                nama_barang: data.nama_barang,
                jumlah: data.jumlah,
                keterangan: data.keterangan,
                created_at: formattedDate,
                created_by: {
                    id: data.user_id, 
                    username: data.created_by 
                }
            }
        });
    });
};





exports.addBarangKeluar = (req, res) => {
    const { nama_kategori, nama_barang, jumlah_keluar, keterangan } = req.body;

    if (!nama_kategori || !nama_barang || jumlah_keluar === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Kategori, nama barang, dan jumlah keluar harus diisi.'
        });
    }

    if (isNaN(jumlah_keluar) || jumlah_keluar <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Jumlah keluar harus berupa angka positif.'
        });
    }

    if (!req.user || !req.user.id) {
        return res.status(401).json({
            success: false,
            message: 'Pengguna tidak terautentikasi dengan benar.'
        });
    }

    const getBarangQuery = `
        SELECT b.id_barang, b.stok, k.id_kategori
        FROM barang b
        JOIN kategori k ON b.id_kategori = k.id_kategori
        WHERE b.nama_barang = ? AND k.nama_kategori = ?
    `;

    pool.query(getBarangQuery, [nama_barang, nama_kategori], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                success: false,
                message: 'Error saat mencari barang atau kategori.',
                error: err.sqlMessage
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tidak ada barang yang ditemukan dalam kategori ini.'
            });
        }

        const { id_barang, stok } = result[0];

        const getLastIdKeluarQuery = `SELECT id_keluar FROM barang_keluar ORDER BY id_keluar DESC LIMIT 1`;

        pool.query(getLastIdKeluarQuery, (err, result) => {
            if (err) {
                console.error('Error mendapatkan id_keluar terakhir:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error saat mendapatkan id_keluar terakhir.',
                    error: err.sqlMessage
                });
            }

            let newIdKeluar = 'BK00000001';
            if (result.length > 0) {
                const lastIdKeluar = result[0].id_keluar;
                const lastNumber = parseInt(lastIdKeluar.slice(2));
                newIdKeluar = `BK${String(lastNumber + 1).padStart(8, '0')}`;
            }

            const newStok = stok - jumlah_keluar;

            const updateStokQuery = `UPDATE barang SET stok = ? WHERE id_barang = ?`;
            pool.query(updateStokQuery, [newStok, id_barang], (err) => {
                if (err) {
                    console.error('Error mengupdate stok barang:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error mengupdate stok barang.',
                        error: err.sqlMessage
                    });
                }

                const insertBarangKeluarQuery = `
                    INSERT INTO barang_keluar (id_keluar, id_barang, jumlah, keterangan, tanggal_keluar, created_by)
                    VALUES (?, ?, ?, ?, NOW(), ?)
                `;

                pool.query(insertBarangKeluarQuery, [newIdKeluar, id_barang, jumlah_keluar, keterangan || null, req.user.id], (err) => {
                    if (err) {
                        console.error('Error menambahkan barang keluar:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Error menambahkan barang keluar.',
                            error: err.sqlMessage
                        });
                    }
                    res.status(201).json({
                        success: true,
                        message: 'Barang keluar berhasil ditambahkan dan stok barang diupdate.',
                        data: {
                            id_keluar: newIdKeluar,
                            id_barang: id_barang,
                            nama_barang: nama_barang,
                            kategori: nama_kategori,
                            jumlah_keluar: jumlah_keluar,
                            keterangan: keterangan || null,
                            new_stok: newStok,
                            created_by: req.user.id,
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
};


// Update barang keluar berdasarkan id_keluar
exports.updateBarangKeluar = (req, res) => {
    const { id_keluar } = req.params;
    const { nama_kategori, nama_barang, jumlah_keluar, keterangan } = req.body;

    if (!nama_kategori || !nama_barang || jumlah_keluar === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Kategori, nama barang, dan jumlah keluar harus diisi.'
        });
    }

    if (isNaN(jumlah_keluar) || jumlah_keluar <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Jumlah keluar harus berupa angka positif.'
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

        const getBarangKeluarQuery = `
            SELECT bk.id_barang, bk.jumlah AS jumlah_keluar_lama, b.stok
            FROM barang_keluar bk
            JOIN barang b ON bk.id_barang = b.id_barang
            WHERE bk.id_keluar = ? AND b.nama_barang = ? AND b.id_kategori = ?`;

        pool.query(getBarangKeluarQuery, [id_keluar, nama_barang, id_kategori], (err, result) => {
            if (err) {
                console.error('Kesalahan Query Barang Keluar:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error memeriksa barang keluar',
                    error: err.sqlMessage
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Barang keluar tidak ditemukan atau data barang dan kategori tidak cocok.'
                });
            }

            const { id_barang, jumlah_keluar_lama, stok } = result[0];

            const jumlahSelisih = jumlah_keluar_lama - jumlah_keluar;

            const updateStokQuery = 'UPDATE barang SET stok = stok + ? WHERE id_barang = ?';
            pool.query(updateStokQuery, [jumlahSelisih, id_barang], (err) => {
                if (err) {
                    console.error('Error mengupdate stok barang:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error mengupdate stok barang.',
                        error: err.sqlMessage
                    });
                }

                const updateBarangKeluarQuery = `
                    UPDATE barang_keluar
                    SET jumlah = ?, keterangan = ?, tanggal_keluar = NOW(), created_by = ?, updated_at = NOW()
                    WHERE id_keluar = ?`;

                    pool.query(updateBarangKeluarQuery, [jumlah_keluar, keterangan || null, req.user.id, id_keluar], (err) => {
                        if (err) {
                            console.error('Error mengupdate barang keluar:', err);
                            return res.status(500).json({
                                success: false,
                                message: 'Error mengupdate barang keluar.',
                                error: err.sqlMessage
                            });
                        }
                        res.status(200).json({
                            success: true,
                            message: 'Barang keluar berhasil diperbarui dan stok barang diperbarui.',
                            data: {
                                id_keluar,
                                nama_kategori,
                                nama_barang,
                                jumlah_keluar,
                                keterangan: keterangan || null 
                            }
                        });
                    });
            });
        });
    });
};



// Menghapus barang keluar (soft delete)
exports.deleteBarangKeluar = (req, res) => {
    const { id } = req.params;

    const getBarangKeluarQuery = `SELECT id_barang, jumlah FROM barang_keluar WHERE id_keluar = ? AND deleted_at IS NULL`;

    pool.query(getBarangKeluarQuery, [id], (err, results) => {
        if (err) {
            console.error('Error saat mengambil data barang keluar:', err);
            return res.status(500).json({
                success: false,
                message: 'Error mengambil data barang keluar',
                error: err.sqlMessage
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Barang keluar tidak ditemukan'
            });
        }

        const id_barang = results[0].id_barang;
        const jumlah = results[0].jumlah;

        const deleteQuery = `
            UPDATE barang_keluar 
            SET deleted_at = NOW() 
            WHERE id_keluar = ?`;

        pool.query(deleteQuery, [id], (err, deleteResult) => {
            if (err) {
                console.error('Error saat menghapus barang keluar:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error menghapus barang keluar',
                    error: err.sqlMessage
                });
            }

            const updateStokQuery = `
                UPDATE barang 
                SET stok = stok + ? 
                WHERE id_barang = ?`;

            pool.query(updateStokQuery, [jumlah, id_barang], (err, stokResult) => {
                if (err) {
                    console.error('Error saat mengupdate stok barang:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error mengupdate stok barang',
                        error: err.sqlMessage
                    });
                }

                res.status(200).json({
                    success: true,
                    message: 'Barang keluar berhasil dihapus dan stok diupdate'
                });
            });
        });
    });
};