import fastify, { FastifyInstance } from 'fastify';
import { MikroORM, EntityManager, RequestContext } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Accommodation } from '../../src/entities/accommodation.entity';
import { Hotel } from '../../src/entities/hotel.entity';
import { Apartment } from '../../src/entities/apartment.entity';
import { Booking } from '../../src/entities/booking.entity';

export interface TestContext {
  server: FastifyInstance;
  orm: MikroORM<PostgreSqlDriver>;
  em: EntityManager;
}

export async function createTestServer(): Promise<TestContext> {
  const server = fastify({ logger: false });

  const orm = await MikroORM.init<PostgreSqlDriver>({
    entities: [Accommodation, Hotel, Apartment, Booking],
    dbName: process.env.DB_NAME || 'accommodation_booking',
    type: 'postgresql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    metadataProvider: TsMorphMetadataProvider,
    allowGlobalContext: true,
  });

  server.decorate('orm', orm);
  // Fork a fresh entity manager for each request to avoid stale identity maps
  server.addHook('onRequest', async (request, reply) => {
    (server as unknown as { em: EntityManager }).em = orm.em.fork();
  });
  server.decorate('em', orm.em.fork());

  return { server, orm, em: orm.em };
}

export async function cleanupTestServer(context: TestContext): Promise<void> {
  // Clean up test data before closing
  await clearDatabase(context.em);
  await context.server.close();
  await context.orm.close();
}

export async function clearDatabase(em: EntityManager): Promise<void> {
  const connection = em.getConnection();
  await connection.execute('TRUNCATE TABLE booking CASCADE');
  await connection.execute('TRUNCATE TABLE accommodation CASCADE');
}
