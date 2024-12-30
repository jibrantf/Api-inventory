const pool = require('../config/db'); 

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
      
                const lastId = result[0].id_masuk;
                const lastIdNumber = parseInt(lastId.slice(2)); 
                newId = `BM${String(lastIdNumber + 1).padStart(3, '0')}`; 
            } else {
                newId = 'BM001';
            }

            resolve(newId);
        });
    });
};

module.exports = { generateNewId }; 
