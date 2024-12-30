require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../config/db'); 

const createSuperuser = async () => {
    const username = 'superuser01'; 
    const password = 'super111';   
    const role = 'superuser';

    try {
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
            const lastId = lastIdResult[0].id;
            const lastNumber = parseInt(lastId.substring(1), 10);
            newId = `U${String(lastNumber + 1).padStart(2, '0')}`; 
        } else {
            newId = 'U01';
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Query untuk insert ke database
        const query = 'INSERT INTO users (id, username, password, role, status) VALUES (?, ?, ?, ?, "approved")';

        const result = await new Promise((resolve, reject) => {
            pool.query(query, [newId, username, hashedPassword, role], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });

        console.log('Superuser berhasil dibuat dengan ID:', newId);
        console.log('Password hash untuk superuser:', hashedPassword);

    } catch (error) {
        console.error('Error membuat superuser:', error);
    } finally {
        pool.end(err => {
            if (err) {
                console.error('Error menutup koneksi database:', err);
            } else {
                console.log('Koneksi database ditutup');
            }
        });
    }
};

createSuperuser();
