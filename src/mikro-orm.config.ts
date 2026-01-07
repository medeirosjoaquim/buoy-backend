import path from 'path';
import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Accommodation } from './entities/accommodation.entity';
import { Hotel } from './entities/hotel.entity';
import { Apartment } from './entities/apartment.entity';
import { Booking } from './entities/booking.entity';

// Resolve paths relative to project root (works for both dev and compiled)
const projectRoot = path.resolve(__dirname, '..');

const mikroOrmConfig: Options<PostgreSqlDriver> = {
  entities: [Accommodation, Hotel, Apartment, Booking],
  entitiesTs: [path.join(projectRoot, 'src/entities')],
  dbName: process.env.DB_NAME || 'accommodation_booking',
  type: 'postgresql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  metadataProvider: TsMorphMetadataProvider,
  migrations: {
    path: path.join(projectRoot, 'src/migrations'),
    disableForeignKeys: false
  }
};

export default mikroOrmConfig;
