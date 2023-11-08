import winston from "winston";
import WinstonGraylog2 from "@eximius/winston-graylog2";
const logger = winston.createLogger({
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
        new WinstonGraylog2({
            name: "classboard",
            level: "info", // 로그 레벨 설정
            graylog: {
                servers: [{ host: "127.0.0.1", port: 12201 }],
                facility: "classboard",
            },
        }),
    ],
});

const stream = {
    // morgan wiston 설정
    write: (message) => {
        logger.info(message);
    },
};
export { logger, stream };
