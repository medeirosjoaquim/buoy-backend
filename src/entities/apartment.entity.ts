import { Entity, Property } from '@mikro-orm/core';
import { Accommodation, AccommodationType } from './accommodation.entity';

@Entity({ discriminatorValue: AccommodationType.APARTMENT })
export class Apartment extends Accommodation {
  type: AccommodationType = AccommodationType.APARTMENT;

  @Property({ nullable: true })
  numberOfRooms?: number;

  @Property({ nullable: true })
  hasParking?: boolean;
}
