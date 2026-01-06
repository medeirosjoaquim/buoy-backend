import { FastifyInstance } from 'fastify';
import { MikroORM } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { createTestServer, cleanupTestServer, clearDatabase, TestContext } from '../setup/test-server';
import hotelRoutes from '../../src/routes/hotel.routes';

describe('Hotel Routes', () => {
  let context: TestContext;
  let server: FastifyInstance;

  beforeAll(async () => {
    context = await createTestServer();
    server = context.server;
    await server.register(hotelRoutes, { prefix: '/hotels' });
    await server.ready();
  });

  afterAll(async () => {
    await cleanupTestServer(context);
  });

  beforeEach(async () => {
    await clearDatabase(context.em);
  });

  describe('POST /hotels', () => {
    it('should create a new hotel', async () => {
      const hotelData = {
        name: 'Grand Hotel',
        price: 150,
        location: 'New York',
        description: 'A luxurious hotel',
        starRating: 5,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/hotels',
        payload: hotelData,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBeDefined();
      expect(body.name).toBe(hotelData.name);
      expect(body.price).toBe(hotelData.price);
      expect(body.location).toBe(hotelData.location);
      expect(body.starRating).toBe(hotelData.starRating);
      expect(body.type).toBe('hotel');
    });

    it('should create a hotel without optional fields', async () => {
      const hotelData = {
        name: 'Simple Hotel',
        price: 100,
        location: 'Boston',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/hotels',
        payload: hotelData,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.name).toBe(hotelData.name);
      expect(body.starRating).toBeUndefined();
    });

    it('should return 400 for invalid hotel data', async () => {
      const invalidData = {
        name: 'AB',
        price: -10,
        location: 'X',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/hotels',
        payload: invalidData,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/hotels',
        payload: { name: 'Hotel Only' },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /hotels', () => {
    it('should return empty array when no hotels exist', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/hotels',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual([]);
    });

    it('should return all hotels', async () => {
      await server.inject({
        method: 'POST',
        url: '/hotels',
        payload: { name: 'Hotel 1', price: 100, location: 'City A' },
      });
      await server.inject({
        method: 'POST',
        url: '/hotels',
        payload: { name: 'Hotel 2', price: 200, location: 'City B' },
      });

      const response = await server.inject({
        method: 'GET',
        url: '/hotels',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveLength(2);
    });

    it('should only return hotels, not apartments', async () => {
      await server.inject({
        method: 'POST',
        url: '/hotels',
        payload: { name: 'Hotel 1', price: 100, location: 'City A' },
      });

      const response = await server.inject({
        method: 'GET',
        url: '/hotels',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveLength(1);
      expect(body[0].type).toBe('hotel');
    });
  });

  describe('GET /hotels/:id', () => {
    it('should return a hotel by id', async () => {
      const createResponse = await server.inject({
        method: 'POST',
        url: '/hotels',
        payload: { name: 'Grand Hotel', price: 150, location: 'NYC' },
      });
      const created = JSON.parse(createResponse.body);

      const response = await server.inject({
        method: 'GET',
        url: `/hotels/${created.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe(created.id);
      expect(body.name).toBe('Grand Hotel');
    });

    it('should return 404 for non-existent hotel', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/hotels/99999',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PUT /hotels/:id', () => {
    it('should update an existing hotel', async () => {
      const createResponse = await server.inject({
        method: 'POST',
        url: '/hotels',
        payload: { name: 'Old Name', price: 100, location: 'Old City' },
      });
      const created = JSON.parse(createResponse.body);

      const response = await server.inject({
        method: 'PUT',
        url: `/hotels/${created.id}`,
        payload: { name: 'New Name', price: 200, location: 'New City', starRating: 4 },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('New Name');
      expect(body.price).toBe(200);
      expect(body.location).toBe('New City');
      expect(body.starRating).toBe(4);
    });

    it('should return 404 when updating non-existent hotel', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: '/hotels/99999',
        payload: { name: 'Name', price: 100, location: 'City' },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /hotels/:id', () => {
    it('should delete an existing hotel', async () => {
      const createResponse = await server.inject({
        method: 'POST',
        url: '/hotels',
        payload: { name: 'Hotel to Delete', price: 100, location: 'City' },
      });
      const created = JSON.parse(createResponse.body);

      const deleteResponse = await server.inject({
        method: 'DELETE',
        url: `/hotels/${created.id}`,
      });

      expect(deleteResponse.statusCode).toBe(204);

      const getResponse = await server.inject({
        method: 'GET',
        url: `/hotels/${created.id}`,
      });

      expect(getResponse.statusCode).toBe(404);
    });

    it('should return 404 when deleting non-existent hotel', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/hotels/99999',
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
