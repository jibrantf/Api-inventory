const pool = require('../config/db');
const { format } = require('date-fns');


// Mendapatkan data dashboard
exports.getDashboardData = (req, res) => {
    // Query untuk menghitung jumlah total barang yang belum dihapus
    const totalBarangQuery = 'SELECT COUNT(*) AS total_barang FROM barang WHERE deleted_at IS NULL';
    
    // Query untuk menghitung jumlah transaksi barang masuk yang belum dihapus
    const totalTransaksiMasukQuery = 'SELECT COUNT(*) AS total_transaksi_masuk FROM barang_masuk WHERE deleted_at IS NULL';
    
    // Query untuk menghitung jumlah transaksi barang keluar yang belum dihapus
    const totalTransaksiKeluarQuery = 'SELECT COUNT(*) AS total_transaksi_keluar FROM barang_keluar WHERE deleted_at IS NULL';
    
    // Query untuk menghitung jumlah transaksi barang rusak yang belum dihapus
    const totalTransaksiRusakQuery = 'SELECT COUNT(*) AS total_transaksi_rusak FROM barang_rusak WHERE deleted_at IS NULL';
    
    // Query untuk menampilkan barang dengan stok kurang dari 10 dan kategori
    const lowStockQuery = `
        SELECT b.part_number, b.nama_barang, b.stok, k.nama_kategori 
        FROM barang b
        JOIN kategori k ON b.id_kategori = k.id_kategori 
        WHERE b.stok < 10 AND b.deleted_at IS NULL`;
    
    // Query untuk mendapatkan 3 barang masuk terbaru
    const recentTransaksiMasukQuery = `
        SELECT bm.id_masuk, bm.jumlah, bm.created_at, b.part_number, b.nama_barang
        FROM barang_masuk bm
        JOIN barang b ON b.part_number = b.part_number
        WHERE bm.deleted_at IS NULL
        ORDER BY bm.created_at DESC
        LIMIT 3`;
    
    // Query untuk mendapatkan 3 barang keluar terbaru
    const recentTransaksiKeluarQuery = `
        SELECT bk.id_keluar, bk.jumlah, bk.created_at, b.part_number, b.nama_barang
        FROM barang_keluar bk
        JOIN barang b ON b.part_number = b.part_number
        WHERE bk.deleted_at IS NULL
        ORDER BY bk.created_at DESC
        LIMIT 3`;

    // Query tambahan untuk menghitung perangkat berdasarkan tipe
    const queryDeviceByType = `
        SELECT type, COUNT(*) AS total_devices 
        FROM device
        WHERE deleted_at IS NULL
        GROUP BY type;
    `;

    // Mulai query satu per satu
    pool.query(totalBarangQuery, (err, totalBarangResult) => {
        if (err) {
            console.error(err); 
            return res.status(500).json({
                success: false,
                message: 'Error mendapatkan total barang',
                error: err.sqlMessage
            });
        }

        const totalBarang = totalBarangResult[0].total_barang;

        pool.query(totalTransaksiMasukQuery, (err, totalTransaksiMasukResult) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: 'Error mendapatkan total transaksi barang masuk',
                    error: err.sqlMessage
                });
            }

            const totalTransaksiMasuk = totalTransaksiMasukResult[0].total_transaksi_masuk;

            pool.query(totalTransaksiKeluarQuery, (err, totalTransaksiKeluarResult) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error mendapatkan total transaksi barang keluar',
                        error: err.sqlMessage
                    });
                }

                const totalTransaksiKeluar = totalTransaksiKeluarResult[0].total_transaksi_keluar;

                pool.query(totalTransaksiRusakQuery, (err, totalTransaksiRusakResult) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            success: false,
                            message: 'Error mendapatkan total transaksi barang rusak',
                            error: err.sqlMessage
                        });
                    }

                    const totalTransaksiRusak = totalTransaksiRusakResult[0].total_transaksi_rusak;

                    pool.query(lowStockQuery, (err, lowStockResult) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({
                                success: false,
                                message: 'Error mendapatkan barang dengan stok kurang dari 10',
                                error: err.sqlMessage
                            });
                        }

                        const lowStockItems = lowStockResult;

                        pool.query(recentTransaksiMasukQuery, (err, recentMasukResult) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).json({
                                    success: false,
                                    message: 'Error mendapatkan transaksi barang masuk terbaru',
                                    error: err.sqlMessage
                                });
                            }

                            const recentMasukItems = recentMasukResult.map(item => ({
                                id_masuk: item.id_barang_masuk,
                                part_number: item.part_number,
                                nama_barang: item.nama_barang,
                                jumlah: item.jumlah,
                                created_at: format(new Date(item.created_at), 'dd MMM yyyy HH:mm:ss') 
                            }));

                            pool.query(recentTransaksiKeluarQuery, (err, recentKeluarResult) => {
                                if (err) {
                                    console.error(err);
                                    return res.status(500).json({
                                        success: false,
                                        message: 'Error mendapatkan transaksi barang keluar terbaru',
                                        error: err.sqlMessage
                                    });
                                }

                                const recentKeluarItems = recentKeluarResult.map(item => ({
                                    id_keluar: item.id_barang_keluar,
                                    part_number: item.part_number,
                                    nama_barang: item.nama_barang,
                                    jumlah: item.jumlah,
                                    created_at: format(new Date(item.created_at), 'dd MMM yyyy HH:mm:ss') 
                                }));

                                pool.query(queryDeviceByType, (err, deviceByTypeResult) => {
                                    if (err) {
                                        console.error(err);
                                        return res.status(500).json({
                                            success: false,
                                            message: 'Error mendapatkan perangkat berdasarkan tipe',
                                            error: err.sqlMessage
                                        });
                                    }

                                    const devicesByType = deviceByTypeResult.map(item => ({
                                        type: item.type,
                                        total_devices: item.total_devices
                                    }));

                                    res.status(200).json({
                                        success: true,
                                        data: {
                                            total_barang: totalBarang,
                                            total_transaksi_masuk: totalTransaksiMasuk,
                                            total_transaksi_keluar: totalTransaksiKeluar,
                                            total_transaksi_rusak: totalTransaksiRusak,
                                            low_stock_items: lowStockItems,
                                            recent_transaksi_masuk: recentMasukItems,
                                            recent_transaksi_keluar: recentKeluarItems,
                                            devices_by_type: devicesByType
                                        }
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



// Endpoint baru untuk mendapatkan total barang masuk, keluar, dan rusak
exports.getTotalBarangData = (req, res) => {
    // Query untuk menghitung jumlah total barang masuk
    const totalBarangMasukQuery = 'SELECT SUM(qty) AS total_barang_masuk FROM barang_masuk WHERE deleted_at IS NULL';

    // Query untuk menghitung jumlah total barang keluar
    const totalBarangKeluarQuery = 'SELECT SUM(qty) AS total_barang_keluar FROM barang_keluar WHERE deleted_at IS NULL';

    // Query untuk menghitung jumlah total barang rusak
    const totalBarangRusakQuery = 'SELECT SUM(qty) AS total_barang_rusak FROM barang_rusak WHERE deleted_at IS NULL';


    // Jalankan semua query secara paralel menggunakan Promise
    Promise.all([
        new Promise((resolve, reject) => {
            pool.query(totalBarangMasukQuery, (err, result) => {
                if (err) return reject(err);
                resolve(result[0].total_barang_masuk || 0);
            });
        }),
        new Promise((resolve, reject) => {
            pool.query(totalBarangKeluarQuery, (err, result) => {
                if (err) return reject(err);
                resolve(result[0].total_barang_keluar || 0);
            });
        }),
        new Promise((resolve, reject) => {
            pool.query(totalBarangRusakQuery, (err, result) => {
                if (err) return reject(err);
                resolve(result[0].total_barang_rusak || 0);
            });
        })
    ])
        .then(([totalBarangMasuk, totalBarangKeluar, totalBarangRusak]) => {
            res.status(200).json({
                success: true,
                data: {
                    total_barang_masuk: totalBarangMasuk,
                    total_barang_keluar: totalBarangKeluar,
                    total_barang_rusak: totalBarangRusak
                }
            });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({
                success: false,
                message: 'Error mendapatkan total data barang',
                error: err.message
            });
        });
};