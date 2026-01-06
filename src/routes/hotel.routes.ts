import { FastifyPluginAsync } from 'fastify';
import { HotelSchema, HotelInput, HotelParamsSchema } from '../schemas/hotel.schema';
import { HotelService } from '../services/hotel.service';
import { toJsonSchema } from '../utils/schema';

const hotelRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', {
    schema: {
      description: 'Get all hotels',
      tags: ['Hotels'],
    },
  }, async () => {
    const service = new HotelService(fastify.em);
    return service.findAll();
  });

  fastify.get('/:id', {
    schema: {
      description: 'Get hotel by ID',
      tags: ['Hotels'],
      params: toJsonSchema(HotelParamsSchema),
    },
  }, async (request, reply) => {
    const { id } = HotelParamsSchema.parse(request.params);
    const service = new HotelService(fastify.em);
    const result = await service.findById(id);

    if (!result.success) {
      return reply.status(404).send({ message: result.message });
    }

    return result.data;
  });

  fastify.post<{ Body: HotelInput }>('/', {
    schema: {
      description: 'Create a new hotel',
      tags: ['Hotels'],
      body: toJsonSchema(HotelSchema),
    },
  }, async (request, reply) => {
    const service = new HotelService(fastify.em);
    const result = await service.create(request.body);

    if (!result.success) {
      return reply.status(400).send({ errors: result.details });
    }

    return reply.status(201).send(result.data);
  });

  fastify.put<{ Body: HotelInput }>('/:id', {
    schema: {
      description: 'Update a hotel',
      tags: ['Hotels'],
      params: toJsonSchema(HotelParamsSchema),
      body: toJsonSchema(HotelSchema),
    },
  }, async (request, reply) => {
    const { id } = HotelParamsSchema.parse(request.params);
    const service = new HotelService(fastify.em);
    const result = await service.update(id, request.body);

    if (!result.success) {
      if (result.error === 'not_found') {
        return reply.status(404).send({ message: result.message });
      }
      return reply.status(400).send({ errors: result.details });
    }

    return result.data;
  });

  fastify.delete('/:id', {
    schema: {
      description: 'Delete a hotel',
      tags: ['Hotels'],
      params: toJsonSchema(HotelParamsSchema),
    },
  }, async (request, reply) => {
    const { id } = HotelParamsSchema.parse(request.params);
    const service = new HotelService(fastify.em);
    const result = await service.delete(id);

    if (!result.success) {
      return reply.status(404).send({ message: result.message });
    }

    return reply.status(204).send();
  });
};

export default hotelRoutes;
