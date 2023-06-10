const UID = require("uid-safe");
const jwt = require("jsonwebtoken");
const { secretKey, options } = require("../config/jwt");

export default {
    sign: async (payload: any) => {
        const result = {
            token: jwt.sign(payload, secretKey, options),
            refreshToken: UID.sync(256),
        };
        return result;
    },
    verify: async (token: any) => {
        let decoded;
        try {
            decoded = jwt.verify(token, secretKey);
        } catch (e: any) {
            if (e.message === "jwt expired") {
                return -1;
            } else if (e.message === "invalid token") {
                return -2;
            } else {
                return -3;
            }
        }
        return decoded;
    },
};
