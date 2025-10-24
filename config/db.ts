import {Pool} from "pg";
import dotenv from "dotenv";
import logger from "../utils/logger";

dotenv.config();


const dbPool= new Pool({
    connectionString : process.env.DATABASE_URL,
});

dbPool.on('connect', () => {
    logger.info('Connected to the database');
});

dbPool.on('error', (err) => {
    logger.error(`Database error: ${err.message}`);
});

export default dbPool;