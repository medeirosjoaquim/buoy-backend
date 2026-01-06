import { Apartment } from '../../../src/entities/apartment.entity';
import { AccommodationType } from '../../../src/entities/accommodation.entity';

describe('Apartment Entity', () => {
  describe('creation', () => {
    it('should create an apartment with required properties', () => {
      const apartment = new Apartment();
      apartment.name = 'Cozy Downtown Apartment';
      apartment.price = 80;
      apartment.location = 'San Francisco';

      expect(apartment.name).toBe('Cozy Downtown Apartment');
      expect(apartment.price).toBe(80);
      expect(apartment.location).toBe('San Francisco');
    });

    it('should have type set to APARTMENT', () => {
      const apartment = new Apartment();

      expect(apartment.type).toBe(AccommodationType.APARTMENT);
    });

    it('should allow optional description', () => {
      const apartment = new Apartment();
      apartment.name = 'Cozy Downtown Apartment';
      apartment.price = 80;
      apartment.location = 'San Francisco';
      apartment.description = 'A cozy apartment near the city center';

      expect(apartment.description).toBe('A cozy apartment near the city center');
    });

    it('should have optional numberOfRooms property', () => {
      const apartment = new Apartment();
      apartment.name = 'Cozy Downtown Apartment';
      apartment.price = 80;
      apartment.location = 'San Francisco';
      apartment.numberOfRooms = 3;

      expect(apartment.numberOfRooms).toBe(3);
    });

    it('should have optional hasParking property', () => {
      const apartment = new Apartment();
      apartment.name = 'Cozy Downtown Apartment';
      apartment.price = 80;
      apartment.location = 'San Francisco';
      apartment.hasParking = true;

      expect(apartment.hasParking).toBe(true);
    });

    it('should initialize with empty bookings collection', () => {
      const apartment = new Apartment();

      expect(apartment.bookings).toBeDefined();
      expect(apartment.bookings.length).toBe(0);
    });
  });
});
