const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.generateToken = (user) => {
    const payload = {
        id_user: user.id,
        username: user.username,
        role: user.role
    };

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
};

exports.verifyToken = (token) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return reject(err);
            }
            resolve(decoded);
        });
    });
};
