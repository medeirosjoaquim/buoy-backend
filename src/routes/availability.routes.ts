import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AvailabilityService } from '../services/availability.service';
import { toJsonSchema } from '../utils/schema';

const AvailabilityParamsSchema = z.object({
  id: z.coerce.number(),
});

const AvailabilityQuerySchema = z.object({
  date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Invalid date format, expected yyyy-mm-dd',
  }),
});

const availabilityRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Params: { id: string };
    Querystring: { date: string };
  }>('/:id/availability', {
    schema: {
      description: 'Get next available date for an accommodation',
      tags: ['Availability'],
      params: toJsonSchema(AvailabilityParamsSchema),
      querystring: toJsonSchema(AvailabilityQuerySchema),
    },
  }, async (request, reply) => {
    const paramsResult = AvailabilityParamsSchema.safeParse(request.params);
    if (!paramsResult.success) {
      return reply.status(400).send({ errors: paramsResult.error.issues });
    }

    const queryResult = AvailabilityQuerySchema.safeParse(request.query);
    if (!queryResult.success) {
      return reply.status(400).send({ errors: queryResult.error.issues });
    }

    const service = new AvailabilityService(fastify.em);
    const result = await service.getNextAvailableDate(
      paramsResult.data.id,
      new Date(queryResult.data.date)
    );

    if (!result.success) {
      if (result.error === 'not_found') {
        return reply.status(404).send({ message: result.message });
      }
      return reply.status(400).send({ message: result.message });
    }

    return result.data;
  });
};

export default availabilityRoutes;
