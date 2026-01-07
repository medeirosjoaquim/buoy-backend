import { FastifyPluginAsync } from 'fastify';
import { Accommodation } from '../entities/accommodation.entity';
import { AccommodationParamsSchema } from '../schemas/accommodation.schema';
import { toJsonSchema } from '../utils/schema';

// Note: POST/PUT/DELETE removed - use /hotels or /apartments endpoints instead.
// Accommodation is an abstract base class with Single Table Inheritance (STI).

const accommodationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', {
    schema: {
      description: 'Get all accommodations (hotels and apartments)',
      tags: ['Accommodations']
    }
  }, async () => {
    return await fastify.em.find(Accommodation, {});
  });

  fastify.get('/:id', {
    schema: {
      description: 'Get accommodation by ID',
      tags: ['Accommodations'],
      params: toJsonSchema(AccommodationParamsSchema)
    }
  }, async (request, reply) => {
    const { id } = AccommodationParamsSchema.parse(request.params);
    const accommodation = await fastify.em.findOne(Accommodation, { id });

    if (!accommodation) {
      return reply.status(404).send({ message: 'Accommodation not found' });
    }

    return accommodation;
  });
};

export default accommodationRoutes;
