import { FastifyInstance } from 'fastify';
import { createTestServer, cleanupTestServer, clearDatabase, TestContext } from '../setup/test-server';
import apartmentRoutes from '../../src/routes/apartment.routes';

describe('Apartment Routes', () => {
  let context: TestContext;
  let server: FastifyInstance;

  beforeAll(async () => {
    context = await createTestServer();
    server = context.server;
    await server.register(apartmentRoutes, { prefix: '/apartments' });
    await server.ready();
  });

  afterAll(async () => {
    await cleanupTestServer(context);
  });

  beforeEach(async () => {
    await clearDatabase(context.em);
  });

  describe('POST /apartments', () => {
    it('should create a new apartment', async () => {
      const apartmentData = {
        name: 'Cozy Apartment',
        price: 80,
        location: 'San Francisco',
        description: 'A cozy place to stay',
        numberOfRooms: 2,
        hasParking: true,
      };

      const response = await server.inject({
        method: 'POST',
        url: '/apartments',
        payload: apartmentData,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBeDefined();
      expect(body.name).toBe(apartmentData.name);
      expect(body.price).toBe(apartmentData.price);
      expect(body.location).toBe(apartmentData.location);
      expect(body.numberOfRooms).toBe(apartmentData.numberOfRooms);
      expect(body.hasParking).toBe(apartmentData.hasParking);
      expect(body.type).toBe('apartment');
    });

    it('should create an apartment without optional fields', async () => {
      const apartmentData = {
        name: 'Simple Apartment',
        price: 60,
        location: 'Oakland',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/apartments',
        payload: apartmentData,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.name).toBe(apartmentData.name);
      expect(body.numberOfRooms).toBeUndefined();
      expect(body.hasParking).toBeUndefined();
    });

    it('should return 400 for invalid apartment data', async () => {
      const invalidData = {
        name: 'AB',
        price: -10,
        location: 'X',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/apartments',
        payload: invalidData,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/apartments',
        payload: { name: 'Apartment Only' },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /apartments', () => {
    it('should return empty array when no apartments exist', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/apartments',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual([]);
    });

    it('should return all apartments', async () => {
      await server.inject({
        method: 'POST',
        url: '/apartments',
        payload: { name: 'Apartment 1', price: 80, location: 'City A' },
      });
      await server.inject({
        method: 'POST',
        url: '/apartments',
        payload: { name: 'Apartment 2', price: 90, location: 'City B' },
      });

      const response = await server.inject({
        method: 'GET',
        url: '/apartments',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveLength(2);
    });

    it('should only return apartments, not hotels', async () => {
      await server.inject({
        method: 'POST',
        url: '/apartments',
        payload: { name: 'Apartment 1', price: 80, location: 'City A' },
      });

      const response = await server.inject({
        method: 'GET',
        url: '/apartments',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveLength(1);
      expect(body[0].type).toBe('apartment');
    });
  });

  describe('GET /apartments/:id', () => {
    it('should return an apartment by id', async () => {
      const createResponse = await server.inject({
        method: 'POST',
        url: '/apartments',
        payload: { name: 'Cozy Apartment', price: 80, location: 'SF' },
      });
      const created = JSON.parse(createResponse.body);

      const response = await server.inject({
        method: 'GET',
        url: `/apartments/${created.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe(created.id);
      expect(body.name).toBe('Cozy Apartment');
    });

    it('should return 404 for non-existent apartment', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/apartments/99999',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PUT /apartments/:id', () => {
    it('should update an existing apartment', async () => {
      const createResponse = await server.inject({
        method: 'POST',
        url: '/apartments',
        payload: { name: 'Old Name', price: 80, location: 'Old City' },
      });
      const created = JSON.parse(createResponse.body);

      const response = await server.inject({
        method: 'PUT',
        url: `/apartments/${created.id}`,
        payload: { name: 'New Name', price: 120, location: 'New City', numberOfRooms: 3, hasParking: true },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('New Name');
      expect(body.price).toBe(120);
      expect(body.location).toBe('New City');
      expect(body.numberOfRooms).toBe(3);
      expect(body.hasParking).toBe(true);
    });

    it('should return 404 when updating non-existent apartment', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: '/apartments/99999',
        payload: { name: 'Name', price: 80, location: 'City' },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /apartments/:id', () => {
    it('should delete an existing apartment', async () => {
      const createResponse = await server.inject({
        method: 'POST',
        url: '/apartments',
        payload: { name: 'Apartment to Delete', price: 80, location: 'City' },
      });
      const created = JSON.parse(createResponse.body);

      const deleteResponse = await server.inject({
        method: 'DELETE',
        url: `/apartments/${created.id}`,
      });

      expect(deleteResponse.statusCode).toBe(204);

      const getResponse = await server.inject({
        method: 'GET',
        url: `/apartments/${created.id}`,
      });

      expect(getResponse.statusCode).toBe(404);
    });

    it('should return 404 when deleting non-existent apartment', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/apartments/99999',
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
