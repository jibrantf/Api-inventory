const pool = require('../config/db'); 
const { format } = require('date-fns'); 

// Mendapatkan semua barang rusak
exports.getBarangRusak = (req, res) => {
    const queryStr = `
        SELECT br.id_rusak, b.part_number, b.id_barang, b.nama_barang, k.id_kategori, k.nama_kategori, 
               br.jumlah, br.keterangan, br.created_at, u.id AS user_id, u.username AS username
        FROM barang_rusak br
        JOIN barang b ON br.id_barang = b.id_barang
        JOIN kategori k ON b.id_kategori = k.id_kategori
        LEFT JOIN users u ON br.created_by = u.id
        WHERE br.deleted_at IS NULL
        ORDER BY br.id_rusak ASC`;

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
            id_rusak: item.id_rusak,
            part_number: item.part_number,
            id_barang: item.id_barang,
            nama_barang: item.nama_barang,
            id_kategori: item.id_kategori,
            nama_kategori: item.nama_kategori,
            jumlah: item.jumlah,
            keterangan: item.keterangan || "",
            created_by: {
                id: item.user_id || null,
                username: item.username || ""
            },
            created_at: item.created_at ? format(new Date(item.created_at), 'yyyy-MM-dd HH:mm:ss') : null
        }));

        res.status(200).json({
            success: true,
            message: 'Data barang rusak berhasil diambil',
            data: formattedResult
        });
    });
};


// Mendapatkan data barang rusak berdasarkan ID
exports.getBarangRusakById = (req, res) => {
    const { id_rusak } = req.params;

    const queryStr = `
        SELECT br.id_rusak, k.nama_kategori, b.nama_barang, br.jumlah, br.keterangan, 
               br.created_at, u.id AS user_id, u.username AS created_by
        FROM barang_rusak br
        JOIN barang b ON br.id_barang = b.id_barang
        JOIN kategori k ON b.id_kategori = k.id_kategori
        LEFT JOIN users u ON br.created_by = u.id
        WHERE br.id_rusak = ? AND br.deleted_at IS NULL
    `;

    pool.query(queryStr, [id_rusak], (err, result) => {
        if (err) {
            console.error('Error saat mengambil data barang rusak:', err);
            return res.status(500).json({
                success: false,
                message: "Terjadi kesalahan pada query database",
                error: err.sqlMessage
            });
        }

        if (!result || result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Barang rusak tidak ditemukan"
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
            message: "Detail barang rusak berhasil diambil",
            data: {
                id_rusak: data.id_rusak,
                nama_kategori: data.nama_kategori,
                nama_barang: data.nama_barang,
                jumlah: data.jumlah,
                keterangan: data.keterangan || "",
                created_at: formattedDate,
                created_by: {
                    id: data.user_id || null, 
                    username: data.created_by || "" 
                }
            }
        });
    });
};




// Menambahkan barang rusak
exports.addBarangRusak = (req, res) => {
    const { nama_kategori, nama_barang, jumlah_rusak, keterangan } = req.body;

    if (!nama_kategori || !nama_barang || jumlah_rusak === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Kategori, nama barang, dan jumlah rusak harus diisi.'
        });
    }

    if (isNaN(jumlah_rusak) || jumlah_rusak <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Jumlah rusak harus berupa angka positif.'
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

        const { id_barang } = result[0];

        const getLastIdRusakQuery = `SELECT id_rusak FROM barang_rusak ORDER BY id_rusak DESC LIMIT 1`;

        pool.query(getLastIdRusakQuery, (err, result) => {
            if (err) {
                console.error('Error mendapatkan id_rusak terakhir:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error saat mendapatkan id_rusak terakhir.',
                    error: err.sqlMessage
                });
            }

            let newIdRusak = 'BR00000001';
            if (result.length > 0) {
                const lastIdRusak = result[0].id_rusak;
                const lastNumber = parseInt(lastIdRusak.slice(2)); 
                newIdRusak = `BR${String(lastNumber + 1).padStart(8, '0')}`;
            }

            const insertBarangRusakQuery = `
                INSERT INTO barang_rusak (id_rusak, id_barang, jumlah, keterangan, tanggal_rusak, created_by)
                VALUES (?, ?, ?, ?, NOW(), ?)
            `;

            pool.query(insertBarangRusakQuery, [newIdRusak, id_barang, jumlah_rusak, keterangan || null, req.user.id], (err, result) => {
                if (err) {
                    console.error('Error menambahkan barang rusak:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error menambahkan barang rusak.',
                        error: err.sqlMessage
                    });
                }

                res.status(201).json({
                    success: true,
                    message: 'Barang rusak berhasil ditambahkan.',
                    data: {
                        id_rusak: newIdRusak,
                        id_barang: id_barang,
                        nama_barang: nama_barang,
                        kategori: nama_kategori,
                        jumlah_rusak: jumlah_rusak,
                        keterangan: keterangan || null, 
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
};




// Mengupdate barang rusak
exports.updateBarangRusak = (req, res) => {
    const { id_rusak } = req.params;
    const { nama_kategori, nama_barang, jumlah_rusak, keterangan } = req.body;

    if (!jumlah_rusak) {
        return res.status(400).json({
            success: false,
            message: 'Jumlah rusak harus diisi.'
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

        const getBarangRusakQuery = `
            SELECT br.id_barang, br.jumlah AS jumlah_rusak_lama, b.stok
            FROM barang_rusak br
            JOIN barang b ON br.id_barang = b.id_barang
            WHERE br.id_rusak = ? AND b.nama_barang = ? AND b.id_kategori = ?`;

        pool.query(getBarangRusakQuery, [id_rusak, nama_barang, id_kategori], (err, result) => {
            if (err) {
                console.error('Kesalahan Query Barang Rusak:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error memeriksa barang rusak',
                    error: err.sqlMessage
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Barang rusak tidak ditemukan atau data barang dan kategori tidak cocok.'
                });
            }

            const { id_barang, jumlah_rusak_lama, stok } = result[0];

            const jumlahSelisih = jumlah_rusak - jumlah_rusak_lama;

            const updateStokQuery = 'UPDATE barang SET stok = stok - ? WHERE id_barang = ?';
            pool.query(updateStokQuery, [jumlahSelisih, id_barang], (err) => {
                if (err) {
                    console.error('Error mengupdate stok barang:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error mengupdate stok barang.',
                        error: err.sqlMessage
                    });
                }

                const updateBarangRusakQuery = `
                    UPDATE barang_rusak
                    SET jumlah = ?, keterangan = ?, tanggal_rusak = NOW(), created_by = ?, updated_at = NOW()
                    WHERE id_rusak = ?`;

                pool.query(updateBarangRusakQuery, [jumlah_rusak, keterangan || null, req.user.id, id_rusak], (err) => {
                    if (err) {
                        console.error('Error mengupdate barang rusak:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Error mengupdate barang rusak.',
                            error: err.sqlMessage
                        });
                    }

                    res.status(200).json({
                        success: true,
                        message: 'Barang rusak berhasil diperbarui dan stok barang diperbarui.',
                        data: {
                            id_rusak,
                            nama_kategori,
                            nama_barang,
                            jumlah_rusak,
                            keterangan: keterangan || null 
                        }
                    });
                });
            });
        });
    });
};




// Menghapus barang rusak (soft delete)
exports.deleteBarangRusak = (req, res) => {
    const { id_rusak } = req.params;

    const queryStr = `
        UPDATE barang_rusak 
        SET deleted_at = NOW() 
        WHERE id_rusak = ? AND deleted_at IS NULL`;

    pool.query(queryStr, [id_rusak], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: 'Error menghapus barang rusak',
                error: err.sqlMessage
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Barang rusak tidak ditemukan untuk dihapus'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Barang rusak berhasil dihapus'
        });
    });
};
