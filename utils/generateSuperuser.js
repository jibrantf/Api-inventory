require('dotenv').config(); // Mengimpor dotenv agar bisa membaca variabel lingkungan
const bcrypt = require('bcrypt');
const pool = require('../config/db'); // Pastikan path ini benar sesuai struktur direktori Anda

const createSuperuser = async () => {
    const username = 'superuser01'; // Username default superuser
    const password = 'super111';     // Password default superuser
    const role = 'superuser';

    try {
        // Cek apakah superuser sudah ada
        const checkQuery = 'SELECT * FROM users WHERE username = ? AND role = ?';
        const existingSuperuser = await new Promise((resolve, reject) => {
            pool.query(checkQuery, [username, role], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });

        if (existingSuperuser.length > 0) {
            console.log('Superuser sudah ada. Tidak perlu membuat superuser baru.');
            return;
        }

        // Ambil ID terakhir dari database untuk menghasilkan ID baru
        const getLastIdQuery = 'SELECT id FROM users ORDER BY id DESC LIMIT 1';
        const lastIdResult = await new Promise((resolve, reject) => {
            pool.query(getLastIdQuery, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });

        let newId;
        if (lastIdResult.length > 0) {
            // Jika ada ID sebelumnya, ambil bagian numeriknya dan tambahkan 1
            const lastId = lastIdResult[0].id;
            const lastNumber = parseInt(lastId.substring(1), 10); // Ambil angka setelah 'U'
            newId = `U${String(lastNumber + 1).padStart(2, '0')}`; // Tambahkan 1 dan format jadi 'U01', 'U02', dst.
        } else {
            // Jika belum ada data, mulai dengan 'U01'
            newId = 'U01';
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Query untuk insert ke database
        const query = 'INSERT INTO users (id, username, password, role, status) VALUES (?, ?, ?, ?, "approved")';

        // Eksekusi query menggunakan promisify untuk menggunakan async/await
        const result = await new Promise((resolve, reject) => {
            pool.query(query, [newId, username, hashedPassword, role], (err, results) => {
                if (err) {
                    reject(err); // Menolak promise jika ada error
                } else {
                    resolve(results); // Menyelesaikan promise dengan hasil
                }
            });
        });

        // Tampilkan informasi superuser yang berhasil dibuat
        console.log('Superuser berhasil dibuat dengan ID:', newId);
        console.log('Password hash untuk superuser:', hashedPassword); // Menampilkan hash password

    } catch (error) {
        console.error('Error membuat superuser:', error);
    } finally {
        // Tutup koneksi setelah semua proses selesai
        pool.end(err => {
            if (err) {
                console.error('Error menutup koneksi database:', err);
            } else {
                console.log('Koneksi database ditutup');
            }
        });
    }
};

// Panggil fungsi untuk membuat superuser
createSuperuser();
