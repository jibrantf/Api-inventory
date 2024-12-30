const bcrypt = require('bcrypt');

// Fungsi untuk melakukan hashing password
const hashPassword = async (password) => {
    try {
        const saltRounds = 10; // Jumlah rounds untuk salt (semakin tinggi semakin aman, tapi juga lebih lambat)
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {   
        console.error("Error hashing password: ", error);
        throw error;
    }
};

module.exports = { hashPassword };
