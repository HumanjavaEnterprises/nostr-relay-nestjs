import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://nostr_user:nostr_password@localhost:5432/nostr_relay';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: DATABASE_URL,
  entities: ['dist/src/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'migrations',
  synchronize: true,  // Keep this true for now
  ssl: process.env.DATABASE_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
});
