import { z } from 'zod';
import { zodToJsonSchema, JsonSchema7Type } from 'zod-to-json-schema';

/**
 * Convert a Zod schema to JSON Schema for Fastify/Swagger integration.
 * Uses zodToJsonSchema internally with type compatibility handling for Zod v4.
 */
export function toJsonSchema(schema: z.ZodTypeAny): JsonSchema7Type {
  // @ts-expect-error - Known type incompatibility between Zod v4 and zod-to-json-schema types
  return zodToJsonSchema(schema);
}
