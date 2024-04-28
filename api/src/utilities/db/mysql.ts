import mysql from 'mysql2/promise'
import bluebird from 'bluebird';
import { logger } from '../logger';
import { AppError } from '../AppError';

import {
    NODE_ENV,
    DB_DEV_HOST,
    DB_DEV_PORT,
    DB_DEV_USER,
    DB_DEV_PASSWORD,
    DB_DEV_DATABASE,
    DB_PRO_HOST,
    DB_PRO_PORT,
    DB_PRO_USER,
    DB_PRO_PASSWORD,
    DB_PRO_DATABASE
} from '../config';

let database: MYSQL_DB | null = null;

class MYSQL_DB {
    #db: mysql.Pool | undefined;
    #host: string | undefined;
    #port: number | undefined;
    #user: string | undefined;
    #password: string | undefined;
    #database: string | undefined;

    constructor() {
        try {
            if (NODE_ENV === 'production') {
                this.#host = DB_PRO_HOST;
                this.#port = parseInt(DB_PRO_PORT);
                this.#user = DB_PRO_USER;
                this.#password = DB_PRO_PASSWORD;
                this.#database = DB_PRO_DATABASE;
            } else {
                this.#host = DB_DEV_HOST;
                this.#port = parseInt(DB_DEV_PORT);
                this.#user = DB_DEV_USER;
                this.#password = DB_DEV_PASSWORD;
                this.#database = DB_DEV_DATABASE;
            }

            this.#db = mysql.createPool({
                host: this.#host,
                port: this.#port,
                database: this.#database,
                user: this.#user,
                password: this.#password,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                namedPlaceholders: true,
                Promise: bluebird
            });

        } catch (err) {
            logger.log('error', 'Error connecting to database.');
            throw new AppError(500, 'Error connecting to database');
        }
    }

    getConnection() { return this.#db; }
}

const getDatabase = async () => {
    try {
        if (!database) {
            database = new MYSQL_DB();
        }
        return database.getConnection();
    } catch (err) {
        return new AppError(500, 'Error connecting to database');
    }
}

export {
    MYSQL_DB,
    getDatabase,
}