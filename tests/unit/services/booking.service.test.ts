import { EntityManager } from '@mikro-orm/core';
import { BookingService } from '../../../src/services/booking.service';
import { Booking } from '../../../src/entities/booking.entity';
import { Hotel } from '../../../src/entities/hotel.entity';
import { Apartment } from '../../../src/entities/apartment.entity';
import { AccommodationType } from '../../../src/entities/accommodation.entity';

describe('BookingService', () => {
  let service: BookingService;
  let mockEm: jest.Mocked<EntityManager>;

  const createMockHotel = (id: number, roomCount: number = 10): Hotel => {
    const hotel = new Hotel();
    hotel.id = id;
    hotel.type = AccommodationType.HOTEL;
    hotel.name = 'Test Hotel';
    hotel.price = 100;
    hotel.location = 'Test Location';
    hotel.roomCount = roomCount;
    return hotel;
  };

  const createMockApartment = (id: number): Apartment => {
    const apartment = new Apartment();
    apartment.id = id;
    apartment.type = AccommodationType.APARTMENT;
    apartment.name = 'Test Apartment';
    apartment.price = 80;
    apartment.location = 'Test Location';
    return apartment;
  };

  const createMockBooking = (id: number, startDate: string, endDate: string): Booking => {
    const booking = new Booking();
    booking.id = id;
    booking.startDate = new Date(startDate);
    booking.endDate = new Date(endDate);
    booking.guestName = 'Test Guest';
    return booking;
  };

  beforeEach(() => {
    mockEm = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      persistAndFlush: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    service = new BookingService(mockEm);
  });

  describe('create', () => {
    const validInput = {
      accommodationId: 1,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-20'),
      guestName: 'John Doe',
    };

    describe('for hotels', () => {
      it('should create booking when rooms are available', async () => {
        const hotel = createMockHotel(1, 10); // 10 rooms
        const existingBooking = createMockBooking(1, '2024-01-10', '2024-01-18');

        mockEm.findOne.mockResolvedValueOnce(hotel); // Find accommodation
        mockEm.find.mockResolvedValueOnce([existingBooking]); // 1 overlapping booking
        const createdBooking = { id: 2, ...validInput, accommodation: hotel } as unknown as Booking;
        mockEm.create.mockReturnValue(createdBooking);
        mockEm.persistAndFlush.mockResolvedValue(undefined);

        const result = await service.create(validInput);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(createdBooking);
        }
      });

      it('should allow multiple overlapping bookings when rooms available', async () => {
        const hotel = createMockHotel(1, 5); // 5 rooms
        const existingBookings = [
          createMockBooking(1, '2024-01-10', '2024-01-18'),
          createMockBooking(2, '2024-01-12', '2024-01-17'),
        ]; // 2 overlapping bookings, 3 rooms still available

        mockEm.findOne.mockResolvedValueOnce(hotel);
        mockEm.find.mockResolvedValueOnce(existingBookings);
        const createdBooking = { id: 3, ...validInput, accommodation: hotel } as unknown as Booking;
        mockEm.create.mockReturnValue(createdBooking);
        mockEm.persistAndFlush.mockResolvedValue(undefined);

        const result = await service.create(validInput);

        expect(result.success).toBe(true);
      });

      it('should reject booking when hotel is fully booked', async () => {
        const hotel = createMockHotel(1, 2); // 2 rooms
        const existingBookings = [
          createMockBooking(1, '2024-01-10', '2024-01-18'),
          createMockBooking(2, '2024-01-12', '2024-01-17'),
        ]; // 2 overlapping bookings, no rooms available

        mockEm.findOne.mockResolvedValueOnce(hotel);
        mockEm.find.mockResolvedValueOnce(existingBookings);

        const result = await service.create(validInput);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('fully_booked');
          expect(result.message).toContain('fully booked');
        }
        expect(mockEm.create).not.toHaveBeenCalled();
      });
    });

    describe('for apartments', () => {
      it('should create booking when no overlap exists', async () => {
        const apartment = createMockApartment(1);

        mockEm.findOne.mockResolvedValueOnce(apartment);
        mockEm.find.mockResolvedValueOnce([]); // No overlapping bookings
        const createdBooking = { id: 1, ...validInput, accommodation: apartment } as unknown as Booking;
        mockEm.create.mockReturnValue(createdBooking);
        mockEm.persistAndFlush.mockResolvedValue(undefined);

        const result = await service.create(validInput);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(createdBooking);
        }
      });

      it('should reject booking with full overlap', async () => {
        const apartment = createMockApartment(1);
        // Existing: Jan 10-20, New: Jan 15-18 (fully inside)
        const existingBooking = createMockBooking(1, '2024-01-10', '2024-01-20');

        mockEm.findOne.mockResolvedValueOnce(apartment);
        mockEm.find.mockResolvedValueOnce([existingBooking]);

        const result = await service.create(validInput);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('overlap');
          expect(result.message).toContain('overlap');
        }
        expect(mockEm.create).not.toHaveBeenCalled();
      });

      it('should reject booking with partial overlap at start', async () => {
        const apartment = createMockApartment(1);
        // Existing: Jan 10-17, New: Jan 15-20 (overlaps at start)
        const existingBooking = createMockBooking(1, '2024-01-10', '2024-01-17');

        mockEm.findOne.mockResolvedValueOnce(apartment);
        mockEm.find.mockResolvedValueOnce([existingBooking]);

        const result = await service.create(validInput);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('overlap');
        }
      });

      it('should reject booking with partial overlap at end', async () => {
        const apartment = createMockApartment(1);
        // Existing: Jan 18-25, New: Jan 15-20 (overlaps at end)
        const existingBooking = createMockBooking(1, '2024-01-18', '2024-01-25');

        mockEm.findOne.mockResolvedValueOnce(apartment);
        mockEm.find.mockResolvedValueOnce([existingBooking]);

        const result = await service.create(validInput);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('overlap');
        }
      });

      it('should allow adjacent bookings (checkout same day as checkin)', async () => {
        const apartment = createMockApartment(1);
        // Existing: Jan 10-15, New: Jan 15-20 (checkout = checkin, no overlap)
        const existingBooking = createMockBooking(1, '2024-01-10', '2024-01-15');

        mockEm.findOne.mockResolvedValueOnce(apartment);
        mockEm.find.mockResolvedValueOnce([]); // Query should return empty for adjacent
        const createdBooking = { id: 2, ...validInput, accommodation: apartment } as unknown as Booking;
        mockEm.create.mockReturnValue(createdBooking);
        mockEm.persistAndFlush.mockResolvedValue(undefined);

        const result = await service.create(validInput);

        expect(result.success).toBe(true);
      });

      it('should allow booking when existing ends before new starts', async () => {
        const apartment = createMockApartment(1);
        // Existing: Jan 1-10, New: Jan 15-20 (no overlap)
        mockEm.findOne.mockResolvedValueOnce(apartment);
        mockEm.find.mockResolvedValueOnce([]);
        const createdBooking = { id: 2, ...validInput, accommodation: apartment } as unknown as Booking;
        mockEm.create.mockReturnValue(createdBooking);
        mockEm.persistAndFlush.mockResolvedValue(undefined);

        const result = await service.create(validInput);

        expect(result.success).toBe(true);
      });
    });

    describe('validation', () => {
      it('should return not_found when accommodation does not exist', async () => {
        mockEm.findOne.mockResolvedValueOnce(null);

        const result = await service.create(validInput);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('not_found');
          expect(result.message).toContain('Accommodation');
        }
      });
    });
  });
});
