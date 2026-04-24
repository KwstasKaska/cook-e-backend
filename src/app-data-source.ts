import path from 'path';
import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  logging: false,
  synchronize: true,
  ssl: { rejectUnauthorized: false },
  entities: [path.join(__dirname + '/entities/*/*{.js,.ts}')],
  migrations: [path.join(__dirname + '/migrations/*')],
});

export default AppDataSource;
