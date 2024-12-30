const pool = require('../config/db');

// Mendapatkan laporan barang dengan opsi filter tanggal
exports.getLaporan = (req, res) => {
    const { tanggal_mulai, tanggal_akhir } = req.query;

    let queryStr = `
        SELECT 
            b.part_number,
            b.nama_barang,
            b.stok,
            k.nama_kategori,
            IFNULL(masuk.jumlah_masuk, 0) AS jumlah_masuk,
            IFNULL(keluar.jumlah_keluar, 0) AS jumlah_keluar,
            IFNULL(rusak.jumlah_rusak, 0) AS jumlah_rusak
        FROM 
            barang b
        JOIN 
            kategori k ON b.id_kategori = k.id_kategori
        LEFT JOIN (
            SELECT 
                id_barang, 
                SUM(jumlah) AS jumlah_masuk
            FROM 
                barang_masuk 
            GROUP BY 
                id_barang
        ) masuk ON b.id_barang = masuk.id_barang
        LEFT JOIN (
            SELECT 
                id_barang, 
                SUM(jumlah) AS jumlah_keluar
            FROM 
                barang_keluar 
            GROUP BY 
                id_barang
        ) keluar ON b.id_barang = keluar.id_barang
        LEFT JOIN (
            SELECT 
                id_barang, 
                SUM(jumlah) AS jumlah_rusak
            FROM 
                barang_rusak 
            GROUP BY 
                id_barang
        ) rusak ON b.id_barang = rusak.id_barang
        WHERE 
            b.deleted_at IS NULL
    `;

    // Filter tanggal jika diberikan
    const values = [];
    if (tanggal_mulai && tanggal_akhir) {
        queryStr += `
            AND b.id_barang IN (
                SELECT id_barang FROM barang_masuk WHERE tanggal_masuk BETWEEN ? AND ?
                UNION ALL
                SELECT id_barang FROM barang_keluar WHERE tanggal_keluar BETWEEN ? AND ?
                UNION ALL
                SELECT id_barang FROM barang_rusak WHERE tanggal_rusak BETWEEN ? AND ?
            )
        `;
        values.push(tanggal_mulai, tanggal_akhir, tanggal_mulai, tanggal_akhir, tanggal_mulai, tanggal_akhir);
    }

    pool.query(queryStr, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: 'Error mendapatkan laporan barang',
                error: err.sqlMessage
            });
        }

        res.status(200).json({
            success: true,
            data: result
        });
    });
};
