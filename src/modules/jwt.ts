import UID from "uid-safe";
import jwt from "jsonwebtoken";
import config from "../config/jwt.js";

export default {
    sign: async (payload: any) => {
        const result = {
            token: jwt.sign(payload, config.secretKey, config.option),
            refreshToken: UID.sync(256),
        };
        return result;
    },
    verify: async (token: any) => {
        let decoded;
        try {
            decoded = jwt.verify(token, config.secretKey);
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
