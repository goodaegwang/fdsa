const {createLogger, format, transports} = require("winston");
const {combine, timestamp, label, colorize, printf} = format;
const path = require("path");
const DailyRotateFile = require("winston-daily-rotate-file");
const fs = require("fs");
const dayjs = require("dayjs");
const morgan = require("morgan");
const rfs = require("rotating-file-stream");
const strip = require("strip-color");
const config = require("config");
const _ = require("lodash");
const logDir = "log";

fs.existsSync(logDir) || fs.mkdirSync(logDir);

const accessOption = {
    stream: rfs("access.log", {
        interval: "1d", // rotate daily
        path: logDir,
        compress: "gzip", // compress rotated files
    }),
};

morgan.token("date", () => dayjs().format("YYYY-MM-DD HH:mm:ss:SSS"));

module.exports = file => {

    const filename = path.basename(file);
    const logLevel = config.get("server.logCategory") === "development" ? "silly" : "info";

    return createLogger({
        // change level if in dev environment versus production
        level: logLevel,
        format: combine(
            label({label: filename, filename}),
            timestamp({format: "YYYY-MM-DD HH:mm:ss:SSS"}),
        ),
        transports: [
            new transports.Console({
                level: logLevel,
                format: combine(
                    colorize(),
                    printf(
                        info => {
                            let message = typeof info.message === "object" ? JSON.stringify(info.message) : info.message;

                            if (info.length) {
                                message = _.truncate(message, {length: info.length});
                            }

                            return `${info.timestamp} ${info.level} ${info.label}: ${message}`;
                        },
                    ),
                ),
            }),
            new DailyRotateFile({
                level: "debug",
                filename: `${logDir}/api_server_%DATE%.log`,
                datePattern: "YYYY-MM-DD",
                format: combine(
                    printf(
                        info =>
                            strip(`${info.timestamp} ${info.level} ${info.label}: ${typeof info.message === "object" ? JSON.stringify(info.message) : info.message}`),
                    ),
                ),
                maxsize: 2000, // 일단은 테스트로 2000bytes. 나중에 적당한 크기로 변경해야 함
                maxFiles: 5,
                tailable: true,
            }),
            new DailyRotateFile({
                level: "error",
                filename: `${logDir}/error_api_server_%DATE%.log`,
                datePattern: "YYYY-MM-DD",
                format: combine(
                    printf(
                        info =>
                            `${info.timestamp} ${info.level} ${info.label}: ${typeof info.message === "object" ? JSON.stringify(info.message) : info.message}`,
                    ),
                ),
                maxsize: 2000, // 일단은 테스트로 2000bytes. 나중에 적당한 크기로 변경해야 함
                maxFiles: 5,
                tailable: true,
            }),
        ],
    });
};

module.exports.accessLogger = () => morgan("common", accessOption);
