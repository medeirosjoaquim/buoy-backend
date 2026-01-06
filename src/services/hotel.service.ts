import { EntityManager } from '@mikro-orm/core';
import { Hotel } from '../entities/hotel.entity';
import { AccommodationType } from '../entities/accommodation.entity';
import { HotelSchema, HotelInput } from '../schemas/hotel.schema';
import { ServiceResult } from '../types/service.types';

export class HotelService {
  constructor(private em: EntityManager) {}

  async findAll(): Promise<Hotel[]> {
    return this.em.find(Hotel, {});
  }

  async findById(id: number): Promise<ServiceResult<Hotel>> {
    const hotel = await this.em.findOne(Hotel, { id });
    if (!hotel) {
      return { success: false, error: 'not_found', message: 'Hotel not found' };
    }
    return { success: true, data: hotel };
  }

  async create(input: HotelInput): Promise<ServiceResult<Hotel>> {
    const validation = HotelSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: 'validation_error', message: 'Validation failed', details: validation.error.errors };
    }

    const hotel = this.em.create(Hotel, {
      ...validation.data,
      type: AccommodationType.HOTEL,
    });
    await this.em.persistAndFlush(hotel);
    return { success: true, data: hotel };
  }

  async update(id: number, input: HotelInput): Promise<ServiceResult<Hotel>> {
    const hotel = await this.em.findOne(Hotel, { id });
    if (!hotel) {
      return { success: false, error: 'not_found', message: 'Hotel not found' };
    }

    const validation = HotelSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: 'validation_error', message: 'Validation failed', details: validation.error.errors };
    }

    this.em.assign(hotel, validation.data);
    await this.em.flush();
    return { success: true, data: hotel };
  }

  async delete(id: number): Promise<ServiceResult<void>> {
    const hotel = await this.em.findOne(Hotel, { id });
    if (!hotel) {
      return { success: false, error: 'not_found', message: 'Hotel not found' };
    }

    await this.em.removeAndFlush(hotel);
    return { success: true, data: undefined };
  }
}
