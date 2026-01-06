import { EntityManager } from '@mikro-orm/core';
import { Apartment } from '../entities/apartment.entity';
import { AccommodationType } from '../entities/accommodation.entity';
import { ApartmentSchema, ApartmentInput } from '../schemas/apartment.schema';
import { ServiceResult } from '../types/service.types';

export class ApartmentService {
  constructor(private em: EntityManager) {}

  async findAll(): Promise<Apartment[]> {
    return this.em.find(Apartment, {});
  }

  async findById(id: number): Promise<ServiceResult<Apartment>> {
    const apartment = await this.em.findOne(Apartment, { id });
    if (!apartment) {
      return { success: false, error: 'not_found', message: 'Apartment not found' };
    }
    return { success: true, data: apartment };
  }

  async create(input: ApartmentInput): Promise<ServiceResult<Apartment>> {
    const validation = ApartmentSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: 'validation_error', message: 'Validation failed', details: validation.error.errors };
    }

    const apartment = this.em.create(Apartment, {
      ...validation.data,
      type: AccommodationType.APARTMENT,
    });
    await this.em.persistAndFlush(apartment);
    return { success: true, data: apartment };
  }

  async update(id: number, input: ApartmentInput): Promise<ServiceResult<Apartment>> {
    const apartment = await this.em.findOne(Apartment, { id });
    if (!apartment) {
      return { success: false, error: 'not_found', message: 'Apartment not found' };
    }

    const validation = ApartmentSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, error: 'validation_error', message: 'Validation failed', details: validation.error.errors };
    }

    this.em.assign(apartment, validation.data);
    await this.em.flush();
    return { success: true, data: apartment };
  }

  async delete(id: number): Promise<ServiceResult<void>> {
    const apartment = await this.em.findOne(Apartment, { id });
    if (!apartment) {
      return { success: false, error: 'not_found', message: 'Apartment not found' };
    }

    await this.em.removeAndFlush(apartment);
    return { success: true, data: undefined };
  }
}
