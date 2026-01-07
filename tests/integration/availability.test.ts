import { createTestServer, cleanupTestServer, clearDatabase, TestContext } from '../setup/test-server';
import hotelRoutes from '../../src/routes/hotel.routes';
import apartmentRoutes from '../../src/routes/apartment.routes';
import bookingRoutes from '../../src/routes/booking.routes';
import availabilityRoutes from '../../src/routes/availability.routes';

describe('Availability API', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestServer();
    await context.server.register(hotelRoutes, { prefix: '/hotels' });
    await context.server.register(apartmentRoutes, { prefix: '/apartments' });
    await context.server.register(bookingRoutes, { prefix: '/bookings' });
    await context.server.register(availabilityRoutes, { prefix: '/accommodations' });
    await context.server.ready();
  });

  afterAll(async () => {
    await cleanupTestServer(context);
  });

  beforeEach(async () => {
    await clearDatabase(context.em);
  });

  describe('GET /accommodations/:id/availability', () => {
    describe('for apartments', () => {
      it('should return requested date when apartment is available', async () => {
        const apartmentResponse = await context.server.inject({
          method: 'POST',
          url: '/apartments',
          payload: {
            name: 'Cozy Apartment',
            price: 80,
            location: 'Brooklyn',
          },
        });
        const apartment = JSON.parse(apartmentResponse.body);

        const response = await context.server.inject({
          method: 'GET',
          url: `/accommodations/${apartment.id}/availability?date=2024-01-15`,
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.body);
        expect(result.accommodationId).toBe(apartment.id);
        expect(result.requestedDate).toBe('2024-01-15');
        expect(result.nextAvailableDate).toBe('2024-01-15');
        expect(result.isRequestedDateAvailable).toBe(true);
      });

      it('should return next available date when apartment is booked', async () => {
        const apartmentResponse = await context.server.inject({
          method: 'POST',
          url: '/apartments',
          payload: {
            name: 'Studio Apartment',
            price: 100,
            location: 'Manhattan',
          },
        });
        const apartment = JSON.parse(apartmentResponse.body);

        // Create a booking
        await context.server.inject({
          method: 'POST',
          url: '/bookings',
          payload: {
            accommodationId: apartment.id,
            startDate: '2024-01-10',
            endDate: '2024-01-20',
            guestName: 'Guest One',
          },
        });

        const response = await context.server.inject({
          method: 'GET',
          url: `/accommodations/${apartment.id}/availability?date=2024-01-15`,
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.body);
        expect(result.nextAvailableDate).toBe('2024-01-20');
        expect(result.isRequestedDateAvailable).toBe(false);
      });

      it('should handle consecutive bookings', async () => {
        const apartmentResponse = await context.server.inject({
          method: 'POST',
          url: '/apartments',
          payload: {
            name: 'Beach Apartment',
            price: 120,
            location: 'Santa Monica',
          },
        });
        const apartment = JSON.parse(apartmentResponse.body);

        // Create consecutive bookings
        await context.server.inject({
          method: 'POST',
          url: '/bookings',
          payload: {
            accommodationId: apartment.id,
            startDate: '2024-01-10',
            endDate: '2024-01-20',
            guestName: 'Guest One',
          },
        });

        await context.server.inject({
          method: 'POST',
          url: '/bookings',
          payload: {
            accommodationId: apartment.id,
            startDate: '2024-01-20',
            endDate: '2024-01-25',
            guestName: 'Guest Two',
          },
        });

        const response = await context.server.inject({
          method: 'GET',
          url: `/accommodations/${apartment.id}/availability?date=2024-01-15`,
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.body);
        expect(result.nextAvailableDate).toBe('2024-01-25');
        expect(result.isRequestedDateAvailable).toBe(false);
      });
    });

    describe('for hotels', () => {
      it('should return requested date when rooms are available', async () => {
        const hotelResponse = await context.server.inject({
          method: 'POST',
          url: '/hotels',
          payload: {
            name: 'Grand Hotel',
            price: 150,
            location: 'New York',
            starRating: 4,
            roomCount: 3,
          },
        });
        const hotel = JSON.parse(hotelResponse.body);

        // Create 2 bookings (still have 1 room available)
        await context.server.inject({
          method: 'POST',
          url: '/bookings',
          payload: {
            accommodationId: hotel.id,
            startDate: '2024-01-10',
            endDate: '2024-01-20',
            guestName: 'Guest One',
          },
        });

        await context.server.inject({
          method: 'POST',
          url: '/bookings',
          payload: {
            accommodationId: hotel.id,
            startDate: '2024-01-12',
            endDate: '2024-01-18',
            guestName: 'Guest Two',
          },
        });

        const response = await context.server.inject({
          method: 'GET',
          url: `/accommodations/${hotel.id}/availability?date=2024-01-15`,
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.body);
        expect(result.nextAvailableDate).toBe('2024-01-15');
        expect(result.isRequestedDateAvailable).toBe(true);
      });

      it('should return next available date when hotel is fully booked', async () => {
        const hotelResponse = await context.server.inject({
          method: 'POST',
          url: '/hotels',
          payload: {
            name: 'Small Hotel',
            price: 100,
            location: 'Boston',
            starRating: 3,
            roomCount: 2,
          },
        });
        const hotel = JSON.parse(hotelResponse.body);

        // Book both rooms
        await context.server.inject({
          method: 'POST',
          url: '/bookings',
          payload: {
            accommodationId: hotel.id,
            startDate: '2024-01-10',
            endDate: '2024-01-20',
            guestName: 'Guest One',
          },
        });

        await context.server.inject({
          method: 'POST',
          url: '/bookings',
          payload: {
            accommodationId: hotel.id,
            startDate: '2024-01-12',
            endDate: '2024-01-18',
            guestName: 'Guest Two',
          },
        });

        const response = await context.server.inject({
          method: 'GET',
          url: `/accommodations/${hotel.id}/availability?date=2024-01-15`,
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.body);
        // First room frees up on 2024-01-18
        expect(result.nextAvailableDate).toBe('2024-01-18');
        expect(result.isRequestedDateAvailable).toBe(false);
      });

      it('should return requested date when no bookings exist', async () => {
        const hotelResponse = await context.server.inject({
          method: 'POST',
          url: '/hotels',
          payload: {
            name: 'Empty Hotel',
            price: 200,
            location: 'Chicago',
            starRating: 5,
            roomCount: 10,
          },
        });
        const hotel = JSON.parse(hotelResponse.body);

        const response = await context.server.inject({
          method: 'GET',
          url: `/accommodations/${hotel.id}/availability?date=2024-01-15`,
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.body);
        expect(result.nextAvailableDate).toBe('2024-01-15');
        expect(result.isRequestedDateAvailable).toBe(true);
      });
    });

    describe('error handling', () => {
      it('should return 404 for non-existent accommodation', async () => {
        const response = await context.server.inject({
          method: 'GET',
          url: '/accommodations/99999/availability?date=2024-01-15',
        });

        expect(response.statusCode).toBe(404);
      });

      it('should return 400 for invalid date format', async () => {
        const apartmentResponse = await context.server.inject({
          method: 'POST',
          url: '/apartments',
          payload: {
            name: 'Test Apartment',
            price: 80,
            location: 'Test Location',
          },
        });
        const apartment = JSON.parse(apartmentResponse.body);

        const response = await context.server.inject({
          method: 'GET',
          url: `/accommodations/${apartment.id}/availability?date=invalid-date`,
        });

        expect(response.statusCode).toBe(400);
      });

      it('should return 400 for missing date parameter', async () => {
        const apartmentResponse = await context.server.inject({
          method: 'POST',
          url: '/apartments',
          payload: {
            name: 'Test Apartment',
            price: 80,
            location: 'Test Location',
          },
        });
        const apartment = JSON.parse(apartmentResponse.body);

        const response = await context.server.inject({
          method: 'GET',
          url: `/accommodations/${apartment.id}/availability`,
        });

        expect(response.statusCode).toBe(400);
      });
    });
  });
});
