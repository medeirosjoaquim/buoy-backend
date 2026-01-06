import { z } from 'zod';

export const HotelSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  location: z.string().min(2, 'Location must be at least 2 characters'),
  starRating: z.number().int().min(1).max(5).optional(),
});

export type HotelInput = z.infer<typeof HotelSchema>;

export const HotelParamsSchema = z.object({ id: z.coerce.number() });
