require('dotenv').config();
const mysql = require('mysql');

// Konfigurasi koneksi database menggunakan pool
const pool = mysql.createPool({
    connectionLimit: 10,  // Jumlah maksimum koneksi dalam pool
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'api_inventory'
});

// Menangani koneksi ke database
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database: ' + err.stack);
        return;
    }
    console.log('Connected to the database.');
    connection.release(); // Melepaskan koneksi setelah digunakan
});

// Ekspor pool untuk digunakan di tempat lain
module.exports = pool;
