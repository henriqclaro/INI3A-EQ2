import 'dotenv/config';

const POSTGRE_URL: string = `postgresql://postgres:${process.env.DB_USERNAME}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}?schema_public`;

export default POSTGRE_URL;
