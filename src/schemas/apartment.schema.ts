import { z } from 'zod';

export const ApartmentSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  location: z.string().min(2, 'Location must be at least 2 characters'),
  numberOfRooms: z.number().int().positive().optional(),
  hasParking: z.boolean().optional(),
});

export type ApartmentInput = z.infer<typeof ApartmentSchema>;

export const ApartmentParamsSchema = z.object({ id: z.coerce.number() });
