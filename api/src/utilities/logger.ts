import { createLogger, transports, format } from "winston";
import { NODE_ENV } from "./config";

const timeZone = () => {
    return new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
}

const ConsoleLog = new transports.Console({
    format: format.simple()
});

const logger = createLogger({
    transports: [
        new transports.File({
            filename: 'error.log',
            level: 'error',
            format: format.combine(format.timestamp({ format: timeZone }), format.json())
        })
    ]
});

if (NODE_ENV !== 'production') {
    logger.add(ConsoleLog);
}

export { logger };