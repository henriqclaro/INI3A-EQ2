import 'dotenv/config';

const POSTGRES_URL: string = `postgresql://postgres:${process.env.DB_USERNAME}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}?schema_public`;

export default POSTGRES_URL;
