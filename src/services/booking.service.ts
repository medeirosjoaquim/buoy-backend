import { EntityManager } from '@mikro-orm/core';
import { Booking } from '../entities/booking.entity';
import { Accommodation, AccommodationType } from '../entities/accommodation.entity';
import { Hotel } from '../entities/hotel.entity';
import { ServiceResult } from '../types/service.types';

export interface CreateBookingInput {
  accommodationId: number;
  startDate: Date;
  endDate: Date;
  guestName: string;
}

export type BookingServiceResult<T> = ServiceResult<T> | { success: false; error: 'overlap' | 'fully_booked'; message: string };

export class BookingService {
  constructor(private em: EntityManager) {}

  async create(input: CreateBookingInput): Promise<BookingServiceResult<Booking>> {
    // 1. Find accommodation
    const accommodation = await this.em.findOne(Accommodation, { id: input.accommodationId });
    if (!accommodation) {
      return { success: false, error: 'not_found', message: 'Accommodation not found' };
    }

    // 2. Check availability based on accommodation type
    if (accommodation.type === AccommodationType.APARTMENT) {
      // Apartments: no overlapping bookings allowed
      const hasOverlap = await this.hasOverlap(input.accommodationId, input.startDate, input.endDate);
      if (hasOverlap) {
        return {
          success: false,
          error: 'overlap',
          message: 'Booking dates overlap with an existing booking for this apartment',
        };
      }
    } else if (accommodation.type === AccommodationType.HOTEL) {
      // Hotels: check room capacity
      const hotel = accommodation as Hotel;
      const roomCount = hotel.roomCount ?? 1;
      const overlappingCount = await this.countOverlappingBookings(input.accommodationId, input.startDate, input.endDate);
      if (overlappingCount >= roomCount) {
        return {
          success: false,
          error: 'fully_booked',
          message: 'Hotel is fully booked for the requested dates',
        };
      }
    }

    // 3. Create booking
    const booking = this.em.create(Booking, {
      accommodation,
      startDate: input.startDate,
      endDate: input.endDate,
      guestName: input.guestName,
    });

    await this.em.persistAndFlush(booking);
    return { success: true, data: booking };
  }

  /**
   * Check if there's an overlapping booking for the given accommodation and date range.
   */
  private async hasOverlap(accommodationId: number, startDate: Date, endDate: Date): Promise<boolean> {
    const count = await this.countOverlappingBookings(accommodationId, startDate, endDate);
    return count > 0;
  }

  /**
   * Count overlapping bookings for the given accommodation and date range.
   * Two bookings overlap if: existingStart < newEnd AND existingEnd > newStart
   * Adjacent bookings (checkout = checkin) are NOT considered overlapping.
   */
  async countOverlappingBookings(accommodationId: number, startDate: Date, endDate: Date): Promise<number> {
    const overlappingBookings = await this.em.find(Booking, {
      accommodation: { id: accommodationId },
      startDate: { $lt: endDate },
      endDate: { $gt: startDate },
    });

    return overlappingBookings.length;
  }
}
