import { Entity, Property, PrimaryKey, ManyToOne, Index } from '@mikro-orm/core';
import { Accommodation } from './accommodation.entity';

@Entity()
@Index({ properties: ['accommodation', 'startDate', 'endDate'] })
export class Booking {
  @PrimaryKey()
  id!: number;

  @ManyToOne()
  accommodation!: Accommodation;

  @Property()
  startDate!: Date;

  @Property()
  endDate!: Date;

  @Property()
  guestName!: string;
}
