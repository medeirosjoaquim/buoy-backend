import { Entity, Property, PrimaryKey, OneToMany, Collection, Enum } from '@mikro-orm/core';
import { Booking } from './booking.entity';

export enum AccommodationType {
  HOTEL = 'hotel',
  APARTMENT = 'apartment',
}

@Entity({
  discriminatorColumn: 'type',
  discriminatorMap: {
    [AccommodationType.HOTEL]: 'Hotel',
    [AccommodationType.APARTMENT]: 'Apartment',
  },
})
export abstract class Accommodation {
  @PrimaryKey()
  id!: number;

  @Enum(() => AccommodationType)
  type!: AccommodationType;

  @Property()
  name!: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property({ type: 'decimal' })
  price!: number;

  @Property()
  location!: string;

  @OneToMany(() => Booking, booking => booking.accommodation)
  bookings = new Collection<Booking>(this);
}
