import path from 'path';
import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  logging: false,
  synchronize: true,
  // SSL μόνο σε production (Neon), όχι locally
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  entities: [path.join(__dirname + '/entities/*/*{.js,.ts}')],
  migrations: [path.join(__dirname + '/migrations/*')],
});

export default AppDataSource;
