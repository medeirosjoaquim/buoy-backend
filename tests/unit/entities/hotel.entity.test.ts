import { Hotel } from '../../../src/entities/hotel.entity';
import { AccommodationType } from '../../../src/entities/accommodation.entity';

describe('Hotel Entity', () => {
  describe('creation', () => {
    it('should create a hotel with required properties', () => {
      const hotel = new Hotel();
      hotel.name = 'Grand Hotel';
      hotel.price = 150;
      hotel.location = 'New York';

      expect(hotel.name).toBe('Grand Hotel');
      expect(hotel.price).toBe(150);
      expect(hotel.location).toBe('New York');
    });

    it('should have type set to HOTEL', () => {
      const hotel = new Hotel();

      expect(hotel.type).toBe(AccommodationType.HOTEL);
    });

    it('should allow optional description', () => {
      const hotel = new Hotel();
      hotel.name = 'Grand Hotel';
      hotel.price = 150;
      hotel.location = 'New York';
      hotel.description = 'A luxurious hotel in downtown';

      expect(hotel.description).toBe('A luxurious hotel in downtown');
    });

    it('should have optional starRating property', () => {
      const hotel = new Hotel();
      hotel.name = 'Grand Hotel';
      hotel.price = 150;
      hotel.location = 'New York';
      hotel.starRating = 5;

      expect(hotel.starRating).toBe(5);
    });

    it('should initialize with empty bookings collection', () => {
      const hotel = new Hotel();

      expect(hotel.bookings).toBeDefined();
      expect(hotel.bookings.length).toBe(0);
    });
  });
});
