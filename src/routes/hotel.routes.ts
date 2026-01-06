import { FastifyPluginAsync } from 'fastify';
import { Hotel } from '../entities/hotel.entity';
import { AccommodationType } from '../entities/accommodation.entity';
import { HotelSchema, HotelInput, HotelParamsSchema } from '../schemas/hotel.schema';
import { toJsonSchema } from '../utils/schema';

const hotelRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', {
    schema: {
      description: 'Get all hotels',
      tags: ['Hotels'],
    },
  }, async () => {
    return await fastify.em.find(Hotel, {});
  });

  fastify.get('/:id', {
    schema: {
      description: 'Get hotel by ID',
      tags: ['Hotels'],
      params: toJsonSchema(HotelParamsSchema),
    },
  }, async (request, reply) => {
    const { id } = HotelParamsSchema.parse(request.params);
    const hotel = await fastify.em.findOne(Hotel, { id });

    if (!hotel) {
      return reply.status(404).send({ message: 'Hotel not found' });
    }

    return hotel;
  });

  fastify.post<{ Body: HotelInput }>('/', {
    schema: {
      description: 'Create a new hotel',
      tags: ['Hotels'],
      body: toJsonSchema(HotelSchema),
    },
  }, async (request, reply) => {
    const validationResult = HotelSchema.safeParse(request.body);

    if (!validationResult.success) {
      return reply.status(400).send({ errors: validationResult.error.errors });
    }

    const hotel = fastify.em.create(Hotel, {
      ...validationResult.data,
      type: AccommodationType.HOTEL,
    });
    await fastify.em.persistAndFlush(hotel);
    return reply.status(201).send(hotel);
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
    const hotel = await fastify.em.findOne(Hotel, { id });

    if (!hotel) {
      return reply.status(404).send({ message: 'Hotel not found' });
    }

    const validationResult = HotelSchema.safeParse(request.body);

    if (!validationResult.success) {
      return reply.status(400).send({ errors: validationResult.error.errors });
    }

    fastify.em.assign(hotel, validationResult.data);
    await fastify.em.flush();
    return hotel;
  });

  fastify.delete('/:id', {
    schema: {
      description: 'Delete a hotel',
      tags: ['Hotels'],
      params: toJsonSchema(HotelParamsSchema),
    },
  }, async (request, reply) => {
    const { id } = HotelParamsSchema.parse(request.params);
    const hotel = await fastify.em.findOne(Hotel, { id });

    if (!hotel) {
      return reply.status(404).send({ message: 'Hotel not found' });
    }

    await fastify.em.removeAndFlush(hotel);
    return reply.status(204).send();
  });
};

export default hotelRoutes;
