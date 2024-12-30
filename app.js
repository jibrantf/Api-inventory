const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const pool = require('./config/db');
require('dotenv').config();


// Cek koneksi ke database sebelum menjalankan server
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database: ' + err.stack);
        return;
    }
    console.log('Connected to the database.');
    connection.release();

    // Menjalankan server pada port 3000
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server berjalan di port ${PORT}`);
    });
});



app.use(cors({
    origin: 'http://localhost:3001'
  }));
  
app.use(express.json());


// Mengimpor semua routes
const barangRoutes = require('./routes/barang'); 
const kategoriRoutes = require('./routes/kategori');
const barangMasukRoutes = require('./routes/barang_masuk');
const barangKeluarRoutes = require('./routes/barang_keluar');
const barangRusakRoutes = require('./routes/barang_rusak');
const dashboardRoutes = require('./routes/dashboard');
const laporanRoutes = require('./routes/laporan');
const authRoutes = require('./routes/auth'); 
const deviceRoutes = require('./routes/device');
const installationRoutes = require('./routes/installation');
const maintenanceRoutes = require('./routes/maintenance');
const documentRoutes = require('./routes/document');  



// Menggunakan routes yang sudah diimpor
app.use('/api/barang', barangRoutes);   
app.use('/api/kategori', kategoriRoutes); 
app.use('/api/barang-masuk', barangMasukRoutes); 
app.use('/api/barang-keluar', barangKeluarRoutes); 
app.use('/api/barang-rusak', barangRusakRoutes); 
app.use('/api/dashboard', dashboardRoutes); 
app.use('/api/laporan', laporanRoutes); 
app.use('/api/auth', authRoutes); 
app.use('/api/device', deviceRoutes);
app.use('/api/installation', installationRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/document', documentRoutes); 


// Melayani file statis dari folder 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong!', error: err.message });
});
