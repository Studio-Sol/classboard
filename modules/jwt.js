const UID = require("uid-safe");
const jwt = require('jsonwebtoken');
const secretKey = require('../config/jwt').secretKey;
const options = require('../config/jwt').options;

module.exports = {
    sign: async (payload) => {
        const result = {
            token: jwt.sign(payload, secretKey, options),
            refreshToken: UID.sync(256)
        };
        return result;
    },
    verify: async (token) => {
        let decoded;
        try {
            decoded = jwt.verify(token, secretKey);
        } catch (err) {
            if (err.message === 'jwt expired') {
                return -1;
            } else if (err.message === 'invalid token') {
                return -2;
            } else {
                return -3;
            }
        }
        return decoded;
    }
}