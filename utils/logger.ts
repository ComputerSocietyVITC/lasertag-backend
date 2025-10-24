import {createLogger , transports , format} from "winston";

const { combine, timestamp, printf, colorize } = format;

const logFormat = printf(({ level , message, timestamp})=>{
        return `${timestamp} [${level}]: ${message}`;
});

const logger = createLogger({
    level: 'info',
    format: combine(timestamp() , logFormat),
    transports: [
        new transports.Console({
            format: combine(colorize(), logFormat)
        }),

        new transports.File({filename : "logs/app.log"})
    ]
});


export default logger;