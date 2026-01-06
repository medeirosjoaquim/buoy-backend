import { EntityManager } from '@mikro-orm/core';
import { ApartmentService } from '../../../src/services/apartment.service';
import { Apartment } from '../../../src/entities/apartment.entity';
import { AccommodationType } from '../../../src/entities/accommodation.entity';

describe('ApartmentService', () => {
  let service: ApartmentService;
  let mockEm: jest.Mocked<EntityManager>;

  beforeEach(() => {
    mockEm = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      assign: jest.fn(),
      persistAndFlush: jest.fn(),
      flush: jest.fn(),
      removeAndFlush: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    service = new ApartmentService(mockEm);
  });

  describe('findAll', () => {
    it('should return all apartments from EntityManager', async () => {
      const apartments = [
        { id: 1, name: 'Apt A', type: AccommodationType.APARTMENT },
        { id: 2, name: 'Apt B', type: AccommodationType.APARTMENT },
      ] as Apartment[];
      mockEm.find.mockResolvedValue(apartments);

      const result = await service.findAll();

      expect(mockEm.find).toHaveBeenCalledWith(Apartment, {});
      expect(result).toEqual(apartments);
    });
  });

  describe('findById', () => {
    it('should return success with apartment when found', async () => {
      const apartment = { id: 1, name: 'Apt A', type: AccommodationType.APARTMENT } as Apartment;
      mockEm.findOne.mockResolvedValue(apartment);

      const result = await service.findById(1);

      expect(mockEm.findOne).toHaveBeenCalledWith(Apartment, { id: 1 });
      expect(result).toEqual({ success: true, data: apartment });
    });

    it('should return not_found error when apartment does not exist', async () => {
      mockEm.findOne.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toEqual({
        success: false,
        error: 'not_found',
        message: 'Apartment not found',
      });
    });
  });

  describe('create', () => {
    it('should return validation_error for invalid input', async () => {
      const invalidInput = { name: 'AB', price: -10, location: 'X' };

      const result = await service.create(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('validation_error');
        expect(result.details).toBeDefined();
      }
      expect(mockEm.persistAndFlush).not.toHaveBeenCalled();
    });

    it('should create and persist apartment on valid input', async () => {
      const validInput = { name: 'Cozy Apartment', price: 100, location: 'Brooklyn' };
      const createdApartment = { id: 1, ...validInput, type: AccommodationType.APARTMENT } as Apartment;
      mockEm.create.mockReturnValue(createdApartment);
      mockEm.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.create(validInput);

      expect(mockEm.create).toHaveBeenCalledWith(Apartment, {
        ...validInput,
        type: AccommodationType.APARTMENT,
      });
      expect(mockEm.persistAndFlush).toHaveBeenCalledWith(createdApartment);
      expect(result).toEqual({ success: true, data: createdApartment });
    });

    it('should accept optional apartment-specific fields', async () => {
      const validInput = {
        name: 'Cozy Apartment',
        price: 100,
        location: 'Brooklyn',
        numberOfRooms: 3,
        hasParking: true,
      };
      const createdApartment = { id: 1, ...validInput, type: AccommodationType.APARTMENT } as Apartment;
      mockEm.create.mockReturnValue(createdApartment);
      mockEm.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.create(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(createdApartment);
      }
    });
  });

  describe('update', () => {
    it('should return not_found when apartment does not exist', async () => {
      mockEm.findOne.mockResolvedValue(null);

      const result = await service.update(999, { name: 'Updated', price: 100, location: 'LA' });

      expect(result).toEqual({
        success: false,
        error: 'not_found',
        message: 'Apartment not found',
      });
      expect(mockEm.assign).not.toHaveBeenCalled();
    });

    it('should return validation_error for invalid input', async () => {
      const apartment = { id: 1, name: 'Apt A' } as Apartment;
      mockEm.findOne.mockResolvedValue(apartment);

      const result = await service.update(1, { name: 'AB', price: -10, location: 'X' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('validation_error');
      }
      expect(mockEm.assign).not.toHaveBeenCalled();
    });

    it('should update apartment on valid input', async () => {
      const apartment = { id: 1, name: 'Apt A', price: 100, location: 'NY' } as Apartment;
      mockEm.findOne.mockResolvedValue(apartment);
      mockEm.flush.mockResolvedValue(undefined);

      const updateInput = { name: 'Updated Apartment', price: 200, location: 'LA' };
      const result = await service.update(1, updateInput);

      expect(mockEm.assign).toHaveBeenCalledWith(apartment, updateInput);
      expect(mockEm.flush).toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: apartment });
    });
  });

  describe('delete', () => {
    it('should return not_found when apartment does not exist', async () => {
      mockEm.findOne.mockResolvedValue(null);

      const result = await service.delete(999);

      expect(result).toEqual({
        success: false,
        error: 'not_found',
        message: 'Apartment not found',
      });
      expect(mockEm.removeAndFlush).not.toHaveBeenCalled();
    });

    it('should remove apartment on success', async () => {
      const apartment = { id: 1, name: 'Apt A' } as Apartment;
      mockEm.findOne.mockResolvedValue(apartment);
      mockEm.removeAndFlush.mockResolvedValue(undefined);

      const result = await service.delete(1);

      expect(mockEm.removeAndFlush).toHaveBeenCalledWith(apartment);
      expect(result).toEqual({ success: true, data: undefined });
    });
  });
});
