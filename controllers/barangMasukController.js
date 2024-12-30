const pool = require('../config/db');
const { format } = require('date-fns');


exports.getAllBarangMasuk = (req, res) => {
    const queryStr = `
        SELECT bm.id_masuk, b.part_number, b.id_barang, b.nama_barang, k.id_kategori, k.nama_kategori, 
               bm.jumlah, bm.keterangan, bm.created_at, u.id AS user_id, u.username AS username
        FROM barang_masuk bm
        JOIN barang b ON bm.id_barang = b.id_barang
        JOIN kategori k ON b.id_kategori = k.id_kategori
        LEFT JOIN users u ON bm.created_by = u.id
        WHERE bm.deleted_at IS NULL
        ORDER BY bm.id_masuk ASC`;

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
            id_masuk: item.id_masuk,
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
            message: 'Data barang masuk berhasil diambil',
            data: formattedResult
        });
    });
};



exports.getBarangMasukById = (req, res) => {
    const { id_masuk } = req.params;

    const queryStr = `
        SELECT bm.id_masuk, k.nama_kategori, b.nama_barang, bm.jumlah, bm.keterangan, 
               bm.created_at, u.id AS user_id, u.username AS created_by
        FROM barang_masuk bm
        JOIN barang b ON bm.id_barang = b.id_barang
        JOIN kategori k ON b.id_kategori = k.id_kategori
        LEFT JOIN users u ON bm.created_by = u.id
        WHERE bm.id_masuk = ? AND bm.deleted_at IS NULL`;

    pool.query(queryStr, [id_masuk], (err, result) => {
        if (err) {
            console.error('Error saat mengambil data barang masuk:', err);
            return res.status(500).json({
                success: false,
                message: "Terjadi kesalahan pada query database",
                error: err.sqlMessage
            });
        }

        if (!result || result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Barang masuk tidak ditemukan"
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
            message: "Detail barang masuk berhasil diambil",
            data: {
                id_masuk: data.id_masuk,
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



exports.addBarangMasuk = (req, res) => {
    const { nama_kategori, nama_barang, jumlah_masuk, keterangan } = req.body;

    if (!nama_kategori || !nama_barang || jumlah_masuk === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Kategori, nama barang, dan jumlah masuk harus diisi.'
        });
    }

    if (isNaN(jumlah_masuk) || jumlah_masuk <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Jumlah masuk harus berupa angka positif.'
        });
    }

    if (!req.user || !req.user.id) {
        return res.status(401).json({
            success: false,
            message: 'Pengguna tidak terautentikasi dengan benar.'
        });
    }

    const keteranganFinal = keterangan || '';


    const getBarangQuery = `
        SELECT b.id_barang, b.stok, k.id_kategori
        FROM barang b
        JOIN kategori k ON b.id_kategori = k.id_kategori
        WHERE b.nama_barang = ? AND k.nama_kategori = ?`;

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

        const getLastIdMasukQuery = `SELECT id_masuk FROM barang_masuk ORDER BY id_masuk DESC LIMIT 1`;

        pool.query(getLastIdMasukQuery, (err, result) => {
            if (err) {
                console.error('Error mendapatkan id_masuk terakhir:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error saat mendapatkan id_masuk terakhir.',
                    error: err.sqlMessage
                });
            }

            let newIdMasuk = 'BM00000001'; 
            if (result.length > 0) {
                const lastIdMasuk = result[0].id_masuk;
                const lastNumber = parseInt(lastIdMasuk.slice(2));
                newIdMasuk = `BM${String(lastNumber + 1).padStart(8, '0')}`;
            }

            const newStok = stok + jumlah_masuk;

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

                const insertBarangMasukQuery = `
                    INSERT INTO barang_masuk (id_masuk, id_barang, jumlah, keterangan, tanggal_masuk, created_by)
                    VALUES (?, ?, ?, ?, NOW(), ?)`;

                pool.query(insertBarangMasukQuery, [newIdMasuk, id_barang, jumlah_masuk, keterangan, req.user.id], (err, result) => {
                    if (err) {
                        console.error('Error menambahkan barang masuk:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Error menambahkan barang masuk.',
                            error: err.sqlMessage
                        });
                    }

                    res.status(201).json({
                        success: true,
                        message: 'Barang masuk berhasil ditambahkan dan stok barang diupdate.',
                        data: {
                            id_masuk: newIdMasuk,
                            id_barang: id_barang,
                            nama_barang: nama_barang,
                            kategori: nama_kategori,
                            jumlah_masuk: jumlah_masuk,
                            keterangan: keteranganFinal,
                            new_stok: newStok,
                            created_by: req.user.username,
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




// Update Barang Masuk
exports.updateBarangMasuk = (req, res) => {
    const { id_masuk } = req.params;
    const { nama_kategori, nama_barang, jumlah_masuk, keterangan } = req.body;

    if (!nama_kategori || !nama_barang || jumlah_masuk === undefined || jumlah_masuk <= 0 || isNaN(jumlah_masuk)) {
        return res.status(400).json({
            success: false,
            message: 'Kategori, nama barang, dan jumlah masuk harus diisi dengan jumlah yang valid.'
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

        const getBarangMasukQuery = `
            SELECT bm.id_barang, bm.jumlah AS jumlah_masuk_lama, b.stok
            FROM barang_masuk bm
            JOIN barang b ON bm.id_barang = b.id_barang
            WHERE bm.id_masuk = ? AND b.nama_barang = ? AND b.id_kategori = ?`;

        pool.query(getBarangMasukQuery, [id_masuk, nama_barang, id_kategori], (err, result) => {
            if (err) {
                console.error('Kesalahan Query Barang Masuk:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error memeriksa barang masuk',
                    error: err.sqlMessage
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Barang masuk tidak ditemukan atau data barang dan kategori tidak cocok.'
                });
            }

            const { id_barang, jumlah_masuk_lama, stok } = result[0];
            const jumlahSelisih = jumlah_masuk - jumlah_masuk_lama;

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

                const updateBarangMasukQuery = `
                    UPDATE barang_masuk
                    SET jumlah = ?, keterangan = ?, tanggal_masuk = NOW(), updated_at = ?, updated_at = NOW()
                    WHERE id_masuk = ?`;

                pool.query(
                    updateBarangMasukQuery,
                    [jumlah_masuk, keterangan || null, req.user.id, id_masuk],
                    (err) => {
                        if (err) {
                            console.error('Error mengupdate barang masuk:', err);
                            return res.status(500).json({
                                success: false,
                                message: 'Error mengupdate barang masuk.',
                                error: err.sqlMessage
                            });
                        }

                        res.status(200).json({
                            success: true,
                            message: 'Barang masuk berhasil diperbarui dan stok barang diperbarui.',
                            data: {
                                id_masuk,
                                nama_kategori,
                                nama_barang,
                                jumlah_masuk,
                                keterangan: keterangan || null
                            }
                        });
                    }
                );
            });
        });
    });
};


// Delete Barang Masuk (Soft Delete)
exports.deleteBarangMasuk = (req, res) => {
    const { id_masuk } = req.params;

    const getBarangMasukQuery = `SELECT id_barang, jumlah FROM barang_masuk WHERE id_masuk = ? AND deleted_at IS NULL`;

    pool.query(getBarangMasukQuery, [id_masuk], (err, results) => {
        if (err) {
            console.error('Error saat mengambil data barang masuk:', err);
            return res.status(500).json({
                success: false,
                message: 'Error mengambil data barang masuk',
                error: err.sqlMessage
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Barang masuk tidak ditemukan'
            });
        }

        const id_barang = results[0].id_barang;
        const jumlah = results[0].jumlah;

        const deleteQuery = `
            UPDATE barang_masuk 
            SET deleted_at = NOW() 
            WHERE id_masuk = ?`;

        pool.query(deleteQuery, [id_masuk], (err) => {
            if (err) {
                console.error('Error saat menghapus barang masuk:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error menghapus barang masuk',
                    error: err.sqlMessage
                });
            }

            const updateStokQuery = `
                UPDATE barang 
                SET stok = stok - ? 
                WHERE id_barang = ?`;

            pool.query(updateStokQuery, [jumlah, id_barang], (err) => {
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
                    message: 'Barang masuk berhasil dihapus dan stok diupdate'
                });
            });
        });
    });
};


