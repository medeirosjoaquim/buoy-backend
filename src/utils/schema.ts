import { z } from 'zod';

/**
 * Convert a Zod schema to JSON Schema for Fastify/Swagger integration.
 * Uses Zod v4's native toJSONSchema method with draft-07 for Fastify compatibility.
 */
export function toJsonSchema(schema: z.ZodType) {
  return z.toJSONSchema(schema, { target: 'draft-07' });
}
