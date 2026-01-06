import { z } from 'zod';
import { BaseAccommodationSchema } from './accommodation.schema';
import { IdParamsSchema } from './common.schema';

export const ApartmentSchema = BaseAccommodationSchema.extend({
  numberOfRooms: z.number().int().positive().optional(),
  hasParking: z.boolean().optional(),
});

export type ApartmentInput = z.infer<typeof ApartmentSchema>;

export const ApartmentParamsSchema = IdParamsSchema;
