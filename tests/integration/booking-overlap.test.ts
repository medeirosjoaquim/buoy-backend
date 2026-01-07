import { createTestServer, cleanupTestServer, clearDatabase, TestContext } from '../setup/test-server';
import hotelRoutes from '../../src/routes/hotel.routes';
import apartmentRoutes from '../../src/routes/apartment.routes';
import bookingRoutes from '../../src/routes/booking.routes';

describe('Booking Overlap Rules', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestServer();
    await context.server.register(hotelRoutes, { prefix: '/hotels' });
    await context.server.register(apartmentRoutes, { prefix: '/apartments' });
    await context.server.register(bookingRoutes, { prefix: '/bookings' });
    await context.server.ready();
  });

  afterAll(async () => {
    await cleanupTestServer(context);
  });

  beforeEach(async () => {
    await clearDatabase(context.em);
  });

  describe('Hotels - Allow Overlapping Bookings', () => {
    it('should allow overlapping bookings for hotels', async () => {
      // Create a hotel with multiple rooms
      const hotelResponse = await context.server.inject({
        method: 'POST',
        url: '/hotels',
        payload: {
          name: 'Grand Hotel',
          price: 150,
          location: 'New York',
          starRating: 4,
          roomCount: 10,
        },
      });
      const hotel = JSON.parse(hotelResponse.body);

      // Create first booking
      const booking1Response = await context.server.inject({
        method: 'POST',
        url: '/bookings',
        payload: {
          accommodationId: hotel.id,
          startDate: '2024-01-10',
          endDate: '2024-01-20',
          guestName: 'Guest One',
        },
      });
      expect(booking1Response.statusCode).toBe(201);

      // Create overlapping booking (should succeed for hotels)
      const booking2Response = await context.server.inject({
        method: 'POST',
        url: '/bookings',
        payload: {
          accommodationId: hotel.id,
          startDate: '2024-01-15',
          endDate: '2024-01-25',
          guestName: 'Guest Two',
        },
      });
      expect(booking2Response.statusCode).toBe(201);
    });

    it('should allow multiple bookings on exact same dates for hotels', async () => {
      const hotelResponse = await context.server.inject({
        method: 'POST',
        url: '/hotels',
        payload: {
          name: 'Beach Resort',
          price: 200,
          location: 'Miami',
          starRating: 5,
          roomCount: 10,
        },
      });
      const hotel = JSON.parse(hotelResponse.body);

      // Create multiple bookings on same dates
      for (let i = 1; i <= 3; i++) {
        const response = await context.server.inject({
          method: 'POST',
          url: '/bookings',
          payload: {
            accommodationId: hotel.id,
            startDate: '2024-02-01',
            endDate: '2024-02-10',
            guestName: `Guest ${i}`,
          },
        });
        expect(response.statusCode).toBe(201);
      }
    });
  });

  describe('Apartments - Reject Overlapping Bookings', () => {
    it('should reject overlapping bookings for apartments', async () => {
      // Create an apartment
      const apartmentResponse = await context.server.inject({
        method: 'POST',
        url: '/apartments',
        payload: {
          name: 'Cozy Apartment',
          price: 80,
          location: 'Brooklyn',
          numberOfRooms: 2,
        },
      });
      const apartment = JSON.parse(apartmentResponse.body);

      // Create first booking
      const booking1Response = await context.server.inject({
        method: 'POST',
        url: '/bookings',
        payload: {
          accommodationId: apartment.id,
          startDate: '2024-01-10',
          endDate: '2024-01-20',
          guestName: 'Guest One',
        },
      });
      expect(booking1Response.statusCode).toBe(201);

      // Create overlapping booking (should fail for apartments)
      const booking2Response = await context.server.inject({
        method: 'POST',
        url: '/bookings',
        payload: {
          accommodationId: apartment.id,
          startDate: '2024-01-15',
          endDate: '2024-01-25',
          guestName: 'Guest Two',
        },
      });
      expect(booking2Response.statusCode).toBe(409);

      const error = JSON.parse(booking2Response.body);
      expect(error.message).toContain('overlap');
    });

    it('should reject booking fully inside existing booking', async () => {
      const apartmentResponse = await context.server.inject({
        method: 'POST',
        url: '/apartments',
        payload: {
          name: 'Studio Apartment',
          price: 60,
          location: 'Manhattan',
        },
      });
      const apartment = JSON.parse(apartmentResponse.body);

      await context.server.inject({
        method: 'POST',
        url: '/bookings',
        payload: {
          accommodationId: apartment.id,
          startDate: '2024-01-10',
          endDate: '2024-01-30',
          guestName: 'Guest One',
        },
      });

      // New booking fully inside existing
      const response = await context.server.inject({
        method: 'POST',
        url: '/bookings',
        payload: {
          accommodationId: apartment.id,
          startDate: '2024-01-15',
          endDate: '2024-01-20',
          guestName: 'Guest Two',
        },
      });
      expect(response.statusCode).toBe(409);
    });

    it('should allow non-overlapping bookings for apartments', async () => {
      const apartmentResponse = await context.server.inject({
        method: 'POST',
        url: '/apartments',
        payload: {
          name: 'Beach Apartment',
          price: 100,
          location: 'Santa Monica',
        },
      });
      const apartment = JSON.parse(apartmentResponse.body);

      // First booking
      const booking1Response = await context.server.inject({
        method: 'POST',
        url: '/bookings',
        payload: {
          accommodationId: apartment.id,
          startDate: '2024-01-10',
          endDate: '2024-01-15',
          guestName: 'Guest One',
        },
      });
      expect(booking1Response.statusCode).toBe(201);

      // Non-overlapping booking (starts after first ends)
      const booking2Response = await context.server.inject({
        method: 'POST',
        url: '/bookings',
        payload: {
          accommodationId: apartment.id,
          startDate: '2024-01-20',
          endDate: '2024-01-25',
          guestName: 'Guest Two',
        },
      });
      expect(booking2Response.statusCode).toBe(201);
    });

    it('should allow adjacent bookings (checkout = checkin)', async () => {
      const apartmentResponse = await context.server.inject({
        method: 'POST',
        url: '/apartments',
        payload: {
          name: 'Downtown Loft',
          price: 120,
          location: 'Chicago',
        },
      });
      const apartment = JSON.parse(apartmentResponse.body);

      // First booking ends Jan 15
      const booking1Response = await context.server.inject({
        method: 'POST',
        url: '/bookings',
        payload: {
          accommodationId: apartment.id,
          startDate: '2024-01-10',
          endDate: '2024-01-15',
          guestName: 'Guest One',
        },
      });
      expect(booking1Response.statusCode).toBe(201);

      // Second booking starts Jan 15 (same day checkout/checkin - allowed)
      const booking2Response = await context.server.inject({
        method: 'POST',
        url: '/bookings',
        payload: {
          accommodationId: apartment.id,
          startDate: '2024-01-15',
          endDate: '2024-01-20',
          guestName: 'Guest Two',
        },
      });
      expect(booking2Response.statusCode).toBe(201);
    });
  });
});
