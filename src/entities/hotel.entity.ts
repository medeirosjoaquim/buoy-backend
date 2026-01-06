import { Entity, Property } from '@mikro-orm/core';
import { Accommodation, AccommodationType } from './accommodation.entity';

@Entity({ discriminatorValue: AccommodationType.HOTEL })
export class Hotel extends Accommodation {
  type: AccommodationType = AccommodationType.HOTEL;

  @Property({ nullable: true })
  starRating?: number;
}
