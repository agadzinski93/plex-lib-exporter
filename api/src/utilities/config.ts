const NODE_ENV: string | undefined = process.env.NODE_ENV;
const PORT: string = process.env.PORT || '5000';
const API_PASSWORD: string | undefined = process.env.API_PASSWORD;

const TVDB_API_SERVER: string | undefined = process.env.TVDB_API_SERVER;
const TVDB_API_KEY: string | undefined = process.env.TVDB_API_KEY;

const DB_DEV_HOST: string | undefined = process.env.DB_DEV_HOST;
const DB_DEV_PORT: string = process.env.DB_DEV_PORT || '3306';
const DB_DEV_USER: string | undefined = process.env.DB_DEV_USER;
const DB_DEV_PASSWORD: string | undefined = process.env.DB_DEV_PASSWORD;
const DB_DEV_DATABASE: string = process.env.DB_DEV_DATABASE || 'ple';

const DB_PRO_HOST: string | undefined = process.env.DB_PRO_HOST;
const DB_PRO_PORT: string = process.env.DB_PRO_PORT || '3306';
const DB_PRO_USER: string | undefined = process.env.DB_PRO_USER;
const DB_PRO_PASSWORD: string | undefined = process.env.DB_PRO_PASSWORD;
const DB_PRO_DATABASE: string | undefined = process.env.DB_PRO_DATABASE;

export {
    NODE_ENV,
    PORT,
    API_PASSWORD,
    TVDB_API_SERVER,
    TVDB_API_KEY,
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
};