import { z } from 'zod';
import { BaseAccommodationSchema } from './accommodation.schema';
import { IdParamsSchema } from './common.schema';

export const HotelSchema = BaseAccommodationSchema.extend({
  starRating: z.number().int().min(1).max(5).optional(),
});

export type HotelInput = z.infer<typeof HotelSchema>;

export const HotelParamsSchema = IdParamsSchema;
