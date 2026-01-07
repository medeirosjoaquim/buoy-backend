import { EntityManager } from '@mikro-orm/core';
import { AvailabilityService } from '../../../src/services/availability.service';
import { Booking } from '../../../src/entities/booking.entity';
import { Hotel } from '../../../src/entities/hotel.entity';
import { Apartment } from '../../../src/entities/apartment.entity';
import { AccommodationType } from '../../../src/entities/accommodation.entity';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let mockEm: jest.Mocked<EntityManager>;

  const createMockHotel = (id: number, roomCount: number = 1): Hotel => {
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

  const createMockBooking = (startDate: string, endDate: string): Booking => {
    const booking = new Booking();
    booking.startDate = new Date(startDate);
    booking.endDate = new Date(endDate);
    booking.guestName = 'Test Guest';
    return booking;
  };

  beforeEach(() => {
    mockEm = {
      findOne: jest.fn(),
      find: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    service = new AvailabilityService(mockEm);
  });

  describe('getNextAvailableDate', () => {
    describe('for apartments', () => {
      it('should return requested date when no bookings exist', async () => {
        const apartment = createMockApartment(1);
        mockEm.findOne.mockResolvedValue(apartment);
        mockEm.find.mockResolvedValue([]);

        const result = await service.getNextAvailableDate(1, new Date('2024-01-15'));

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.nextAvailableDate).toBe('2024-01-15');
          expect(result.data.isRequestedDateAvailable).toBe(true);
        }
      });

      it('should return endDate of overlapping booking', async () => {
        const apartment = createMockApartment(1);
        const booking = createMockBooking('2024-01-10', '2024-01-20');

        mockEm.findOne.mockResolvedValue(apartment);
        mockEm.find.mockResolvedValue([booking]);

        const result = await service.getNextAvailableDate(1, new Date('2024-01-15'));

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.nextAvailableDate).toBe('2024-01-20');
          expect(result.data.isRequestedDateAvailable).toBe(false);
        }
      });

      it('should handle consecutive bookings (chain)', async () => {
        const apartment = createMockApartment(1);
        const booking1 = createMockBooking('2024-01-10', '2024-01-20');
        const booking2 = createMockBooking('2024-01-20', '2024-01-25');

        mockEm.findOne.mockResolvedValue(apartment);
        mockEm.find.mockResolvedValue([booking1, booking2]);

        const result = await service.getNextAvailableDate(1, new Date('2024-01-15'));

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.nextAvailableDate).toBe('2024-01-25');
          expect(result.data.isRequestedDateAvailable).toBe(false);
        }
      });
    });

    describe('for hotels', () => {
      it('should return requested date when bookings are less than room count', async () => {
        const hotel = createMockHotel(1, 3);
        const booking1 = createMockBooking('2024-01-10', '2024-01-20');
        const booking2 = createMockBooking('2024-01-12', '2024-01-18');

        mockEm.findOne.mockResolvedValue(hotel);
        mockEm.find.mockResolvedValue([booking1, booking2]);

        const result = await service.getNextAvailableDate(1, new Date('2024-01-15'));

        expect(result.success).toBe(true);
        if (result.success) {
          // 2 bookings but 3 rooms, so date is available
          expect(result.data.nextAvailableDate).toBe('2024-01-15');
          expect(result.data.isRequestedDateAvailable).toBe(true);
        }
      });

      it('should find next date when fully booked', async () => {
        const hotel = createMockHotel(1, 2);
        const booking1 = createMockBooking('2024-01-10', '2024-01-20');
        const booking2 = createMockBooking('2024-01-12', '2024-01-18');

        mockEm.findOne.mockResolvedValue(hotel);
        mockEm.find.mockResolvedValue([booking1, booking2]);

        const result = await service.getNextAvailableDate(1, new Date('2024-01-15'));

        expect(result.success).toBe(true);
        if (result.success) {
          // 2 bookings and 2 rooms, fully booked until 2024-01-18
          expect(result.data.nextAvailableDate).toBe('2024-01-18');
          expect(result.data.isRequestedDateAvailable).toBe(false);
        }
      });

      it('should return requested date when no bookings exist', async () => {
        const hotel = createMockHotel(1, 5);
        mockEm.findOne.mockResolvedValue(hotel);
        mockEm.find.mockResolvedValue([]);

        const result = await service.getNextAvailableDate(1, new Date('2024-01-15'));

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.nextAvailableDate).toBe('2024-01-15');
          expect(result.data.isRequestedDateAvailable).toBe(true);
        }
      });
    });

    describe('error handling', () => {
      it('should return not_found for non-existent accommodation', async () => {
        mockEm.findOne.mockResolvedValue(null);

        const result = await service.getNextAvailableDate(999, new Date('2024-01-15'));

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('not_found');
        }
      });
    });
  });
});
