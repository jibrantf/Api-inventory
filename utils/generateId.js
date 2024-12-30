const pool = require('../config/db'); // Pastikan untuk mengimpor koneksi database

// Utility untuk menghasilkan ID baru untuk barang masuk
const generateNewId = async () => {
    return new Promise((resolve, reject) => {
        const queryStr = `
            SELECT id_masuk FROM barang_masuk 
            ORDER BY id_masuk DESC LIMIT 1`;

        pool.query(queryStr, (err, result) => {
            if (err) {
                console.error('Error saat mendapatkan ID terakhir:', err);
                return reject(err);
            }

            let newId;

            if (result.length > 0) {
                // Ambil ID terakhir
                const lastId = result[0].id_masuk;
                // Ambil nomor urut dari ID terakhir
                const lastIdNumber = parseInt(lastId.slice(2)); // Mengambil angka setelah 'BM'
                // Tambah 1 untuk ID baru
                newId = `BM${String(lastIdNumber + 1).padStart(3, '0')}`; // Membuat ID baru dengan format BMxxx
            } else {
                // Jika tidak ada barang masuk sebelumnya, mulai dari BM001
                newId = 'BM001';
            }

            resolve(newId);
        });
    });
};

module.exports = { generateNewId }; // Ekspor fungsi agar bisa digunakan di controller