import { EntityManager } from '@mikro-orm/core';
import { Booking } from '../entities/booking.entity';
import { Accommodation, AccommodationType } from '../entities/accommodation.entity';
import { Hotel } from '../entities/hotel.entity';
import { ServiceResult } from '../types/service.types';

export interface AvailabilityResult {
  accommodationId: number;
  requestedDate: string;
  nextAvailableDate: string;
  isRequestedDateAvailable: boolean;
}

export class AvailabilityService {
  constructor(private em: EntityManager) {}

  async getNextAvailableDate(
    accommodationId: number,
    fromDate: Date
  ): Promise<ServiceResult<AvailabilityResult>> {
    // 1. Find accommodation
    const accommodation = await this.em.findOne(Accommodation, { id: accommodationId });
    if (!accommodation) {
      return { success: false, error: 'not_found', message: 'Accommodation not found' };
    }

    // 2. Get capacity (1 for apartments, roomCount for hotels)
    const capacity = accommodation.type === AccommodationType.HOTEL
      ? (accommodation as Hotel).roomCount ?? 1
      : 1;

    // 3. Find next available date
    const nextDate = await this.findNextAvailableDate(accommodationId, fromDate, capacity);

    const requestedDateStr = this.formatDate(fromDate);
    const nextDateStr = this.formatDate(nextDate);

    return {
      success: true,
      data: {
        accommodationId,
        requestedDate: requestedDateStr,
        nextAvailableDate: nextDateStr,
        isRequestedDateAvailable: requestedDateStr === nextDateStr,
      },
    };
  }

  /**
   * Find the next available date starting from the given date.
   * A date is available if the number of overlapping bookings is less than capacity.
   */
  private async findNextAvailableDate(
    accommodationId: number,
    fromDate: Date,
    capacity: number
  ): Promise<Date> {
    // Get all bookings that might affect availability from this date onwards
    const bookings = await this.em.find(
      Booking,
      {
        accommodation: { id: accommodationId },
        endDate: { $gt: fromDate },
      },
      { orderBy: { startDate: 'ASC' } }
    );

    let currentDate = new Date(fromDate);

    // Check availability date by date until we find an available slot
    // Limit to reasonable future (365 days) to avoid infinite loop
    const maxDate = new Date(fromDate);
    maxDate.setDate(maxDate.getDate() + 365);

    while (currentDate <= maxDate) {
      const overlappingCount = this.countOverlappingBookingsOnDate(bookings, currentDate);

      if (overlappingCount < capacity) {
        return currentDate;
      }

      // Find the earliest end date among currently overlapping bookings
      const nextPotentialDate = this.findEarliestEndDate(bookings, currentDate);
      if (nextPotentialDate) {
        currentDate = nextPotentialDate;
      } else {
        // Move to next day if no specific end date found
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // If no availability found within a year, return the max date
    return maxDate;
  }

  /**
   * Count bookings that overlap with a specific date.
   * A booking overlaps with a date if: startDate <= date < endDate
   */
  private countOverlappingBookingsOnDate(bookings: Booking[], date: Date): number {
    return bookings.filter(booking => {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      return start <= date && date < end;
    }).length;
  }

  /**
   * Find the earliest end date among bookings that overlap with the given date.
   */
  private findEarliestEndDate(bookings: Booking[], date: Date): Date | null {
    const overlapping = bookings.filter(booking => {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      return start <= date && date < end;
    });

    if (overlapping.length === 0) {
      return null;
    }

    const earliestEnd = overlapping.reduce((earliest, booking) => {
      const end = new Date(booking.endDate);
      return end < earliest ? end : earliest;
    }, new Date(overlapping[0].endDate));

    return earliestEnd;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
