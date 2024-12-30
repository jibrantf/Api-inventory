const pool = require('../config/db');
const { format } = require('date-fns');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Validasi jenis file dan ukuran file
const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf']; // Tipe file yang diizinkan
const maxSize = 10 * 1024 * 1024; // Maksimum ukuran file 10 MB

const allowedFolders = ['OFA', 'SDFMS', 'MANTUL-GRADER', 'SAFELIGHT', 'other'];

// Setup Multer untuk file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const type = req.body.type ? req.body.type.toUpperCase() : 'OTHER';

        const folder = allowedFolders.includes(type) ? type : 'other';

        const uploadPath = path.join('uploads', folder);

        fs.mkdirSync(uploadPath, { recursive: true });

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const formattedDate = format(new Date(), 'yyyyMMdd-HHmmss'); 
        const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_'); 
        const filename = `${formattedDate}-${sanitizedFileName}`; 

        cb(null, filename); 
    }
});

// Setup Multer untuk validasi file dan batas ukuran
const upload = multer({
    storage,
    limits: { fileSize: maxSize },
    fileFilter: (req, file, cb) => {
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
        }
        cb(null, true);
    }
});

// Fungsi untuk mengunggah file berdasarkan tipe
exports.uploadFilesByType = (req, res) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                console.error('Multer Error:', err);
                return res.status(400).json({
                    success: false,
                    message: `Multer Error: ${err.message}`,
                    error: err.message
                });
            } else {
                console.error('Upload Error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload file.',
                    error: err.message
                });
            }
        }

        const { file, body } = req;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded.'
            });
        }

        if (!body.title || !body.file_name || !body.type) {
            return res.status(400).json({
                success: false,
                message: 'Title, file_name, and type are required.'
            });
        }

        const createdBy = req.user.id;
        const filePath = file.path;
        const fileName = body.file_name;
        const type = body.type.toUpperCase();
        const createdAt = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

        pool.query('SELECT COUNT(*) AS count FROM files', (err, results) => {
            if (err) {
                console.error('Database Error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to generate file ID.',
                    error: err.message
                });
            }

            const fileCount = results[0].count;
            const fileId = `F${(fileCount + 1).toString().padStart(9, '0')}`;  

            const insertQuery = `
                INSERT INTO files (id_file, file_name, title, type, file_path, uploaded_at, uploaded_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            pool.query(insertQuery, [fileId, fileName, body.title, type, filePath, createdAt, createdBy], (err) => {
                if (err) {
                    console.error('Database Error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to save file data in the database.',
                        error: err.message
                    });
                }

                res.status(201).json({
                    success: true,
                    message: 'File uploaded and saved successfully.',
                    data: {
                        id_file: fileId,
                        file_name: fileName,
                        title: body.title,
                        type: type,
                        file_path: filePath,
                        created_at: createdAt,
                        created_by: {
                            id: createdBy,
                            username: req.user.username
                        }
                    }
                });
            });
        });
    });
};





// Mengambil daftar semua file
exports.getAllFiles = (req, res) => {
    const query = 'SELECT id_file, file_name, title, file_path, uploaded_at, uploaded_by FROM files WHERE deleted_at IS NULL';

    pool.query(query, (err, results) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve files from the database.',
                error: err.message
            });
        }

        const formattedResults = results.map(file => ({
            ...file,
            uploaded_at: file.uploaded_at ? format(new Date(file.uploaded_at), 'yyyy-MM-dd HH:mm:ss') : null
        }));

        res.status(200).json({
            success: true,
            data: formattedResults
        });
    });
};

// Mengambil daftar file berdasarkan tipe
exports.getFilesByType = (req, res) => {
    const { type } = req.params;
    const query = `
        SELECT 
            files.id_file, 
            files.file_name, 
            files.title, 
            files.file_path, 
            files.uploaded_at, 
            users.username AS uploaded_by
        FROM files
        JOIN users ON files.uploaded_by = users.id
        WHERE files.type = ? AND files.deleted_at IS NULL
    `;

    pool.query(query, [type.toUpperCase()], (err, results) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve files by type from the database.',
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No files found for type '${type}'.`
            });
        }

        const formattedResults = results.map(file => ({
            ...file,
            uploaded_at: file.uploaded_at ? format(new Date(file.uploaded_at), 'yyyy-MM-dd HH:mm:ss') : null
        }));

        res.status(200).json({
            success: true,
            data: formattedResults
        });
    });
};


// Mengambil file berdasarkan ID
exports.getFileById = (req, res) => {
    const { id_file } = req.params; 

    const query = `
        SELECT 
            files.id_file, 
            files.file_name, 
            files.title, 
            files.type, 
            files.file_path, 
            files.uploaded_at, 
            users.username AS uploaded_by 
        FROM files
        JOIN users ON files.uploaded_by = users.id
        WHERE files.id_file = ? AND files.deleted_at IS NULL
    `;

    pool.query(query, [id_file], (err, results) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve file from the database.',
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'File not found.'
            });
        }

        const file = results[0];

        const formattedFile = {
            ...file,
            uploaded_at: file.uploaded_at ? format(new Date(file.uploaded_at), 'yyyy-MM-dd HH:mm:ss') : null
        };

        res.status(200).json({
            success: true,
            data: formattedFile
        });
    });
};


// Fungsi untuk menghapus file (soft delete)
exports.deleteFile = (req, res) => {
    const { id_file } = req.params;

    const selectQuery = 'SELECT file_path, deleted_at FROM files WHERE id_file = ?';

    pool.query(selectQuery, [id_file], (err, results) => {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve file from the database.',
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'File not found.'
            });
        }

        const file = results[0];

        if (file.deleted_at !== null) {
            return res.status(400).json({
                success: false,
                message: 'File has already been deleted.'
            });
        }

        const deletedAt = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
        const updateQuery = 'UPDATE files SET deleted_at = ? WHERE id_file = ?';

        pool.query(updateQuery, [deletedAt, id_file], (err, results) => {
            if (err) {
                console.error('Database Update Error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update file status in the database.',
                    error: err.message
                });
            }
            res.status(200).json({
                success: true,
                message: 'File deleted successfully.',
                deleted_at: deletedAt
            });
        });
    });
};
