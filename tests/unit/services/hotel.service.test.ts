import { EntityManager } from '@mikro-orm/core';
import { HotelService } from '../../../src/services/hotel.service';
import { Hotel } from '../../../src/entities/hotel.entity';
import { AccommodationType } from '../../../src/entities/accommodation.entity';

describe('HotelService', () => {
  let service: HotelService;
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

    service = new HotelService(mockEm);
  });

  describe('findAll', () => {
    it('should return all hotels from EntityManager', async () => {
      const hotels = [
        { id: 1, name: 'Hotel A', type: AccommodationType.HOTEL },
        { id: 2, name: 'Hotel B', type: AccommodationType.HOTEL },
      ] as Hotel[];
      mockEm.find.mockResolvedValue(hotels);

      const result = await service.findAll();

      expect(mockEm.find).toHaveBeenCalledWith(Hotel, {});
      expect(result).toEqual(hotels);
    });
  });

  describe('findById', () => {
    it('should return success with hotel when found', async () => {
      const hotel = { id: 1, name: 'Hotel A', type: AccommodationType.HOTEL } as Hotel;
      mockEm.findOne.mockResolvedValue(hotel);

      const result = await service.findById(1);

      expect(mockEm.findOne).toHaveBeenCalledWith(Hotel, { id: 1 });
      expect(result).toEqual({ success: true, data: hotel });
    });

    it('should return not_found error when hotel does not exist', async () => {
      mockEm.findOne.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toEqual({
        success: false,
        error: 'not_found',
        message: 'Hotel not found',
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

    it('should create and persist hotel on valid input', async () => {
      const validInput = { name: 'Grand Hotel', price: 150, location: 'New York' };
      const createdHotel = { id: 1, ...validInput, type: AccommodationType.HOTEL, roomCount: 1 } as Hotel;
      mockEm.create.mockReturnValue(createdHotel);
      mockEm.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.create(validInput);

      expect(mockEm.create).toHaveBeenCalledWith(Hotel, {
        ...validInput,
        roomCount: 1,
        type: AccommodationType.HOTEL,
      });
      expect(mockEm.persistAndFlush).toHaveBeenCalledWith(createdHotel);
      expect(result).toEqual({ success: true, data: createdHotel });
    });
  });

  describe('update', () => {
    it('should return not_found when hotel does not exist', async () => {
      mockEm.findOne.mockResolvedValue(null);

      const result = await service.update(999, { name: 'Updated', price: 100, location: 'LA' });

      expect(result).toEqual({
        success: false,
        error: 'not_found',
        message: 'Hotel not found',
      });
      expect(mockEm.assign).not.toHaveBeenCalled();
    });

    it('should return validation_error for invalid input', async () => {
      const hotel = { id: 1, name: 'Hotel A' } as Hotel;
      mockEm.findOne.mockResolvedValue(hotel);

      const result = await service.update(1, { name: 'AB', price: -10, location: 'X' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('validation_error');
      }
      expect(mockEm.assign).not.toHaveBeenCalled();
    });

    it('should update hotel on valid input', async () => {
      const hotel = { id: 1, name: 'Hotel A', price: 100, location: 'NY' } as Hotel;
      mockEm.findOne.mockResolvedValue(hotel);
      mockEm.flush.mockResolvedValue(undefined);

      const updateInput = { name: 'Updated Hotel', price: 200, location: 'LA' };
      const result = await service.update(1, updateInput);

      expect(mockEm.assign).toHaveBeenCalledWith(hotel, updateInput);
      expect(mockEm.flush).toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: hotel });
    });
  });

  describe('delete', () => {
    it('should return not_found when hotel does not exist', async () => {
      mockEm.findOne.mockResolvedValue(null);

      const result = await service.delete(999);

      expect(result).toEqual({
        success: false,
        error: 'not_found',
        message: 'Hotel not found',
      });
      expect(mockEm.removeAndFlush).not.toHaveBeenCalled();
    });

    it('should remove hotel on success', async () => {
      const hotel = { id: 1, name: 'Hotel A' } as Hotel;
      mockEm.findOne.mockResolvedValue(hotel);
      mockEm.removeAndFlush.mockResolvedValue(undefined);

      const result = await service.delete(1);

      expect(mockEm.removeAndFlush).toHaveBeenCalledWith(hotel);
      expect(result).toEqual({ success: true, data: undefined });
    });
  });
});
