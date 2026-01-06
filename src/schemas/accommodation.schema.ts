import { z } from 'zod';
import { IdParamsSchema } from './common.schema';

export const BaseAccommodationSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  location: z.string().min(2, 'Location must be at least 2 characters'),
});

export type BaseAccommodationInput = z.infer<typeof BaseAccommodationSchema>;

// Backward compatibility exports
export const AccommodationSchema = BaseAccommodationSchema;
export type AccommodationInput = BaseAccommodationInput;
export const AccommodationParamsSchema = IdParamsSchema;
