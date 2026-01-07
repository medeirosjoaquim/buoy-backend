import { FastifyPluginAsync } from 'fastify';
import { Booking } from '../entities/booking.entity';
import { BookingInput, BookingSchema, BookingJsonSchema, BookingParamsSchema } from '../schemas/booking.schema';
import { BookingService } from '../services/booking.service';
import { toJsonSchema } from '../utils/schema';

const bookingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', {
    schema: {
      description: 'Get all bookings',
      tags: ['Bookings']
    }
  }, async () => {
    return await fastify.em.find(Booking, {}, { populate: ['accommodation'] });
  });

  fastify.get('/:id', {
    schema: {
      description: 'Get booking by ID',
      tags: ['Bookings'],
      params: toJsonSchema(BookingParamsSchema)
    }
  }, async (request, reply) => {
    const { id } = BookingParamsSchema.parse(request.params);
    const booking = await fastify.em.findOne(Booking, { id }, { populate: ['accommodation'] });

    if (!booking) {
      return reply.status(404).send({ message: 'Booking not found' });
    }

    return booking;
  });

  fastify.post<{ Body: BookingInput }>('/', {
    schema: {
      description: 'Create a new booking',
      tags: ['Bookings'],
      body: BookingJsonSchema,
      response: {
        201: {
          description: 'Booking created successfully',
          type: 'object',
          additionalProperties: true,
        },
        400: {
          description: 'Validation error or accommodation not found',
          type: 'object',
          properties: {
            message: { type: 'string' },
            errors: { type: 'array' },
          },
        },
        409: {
          description: 'Booking conflict - overlap (apartment) or fully booked (hotel)',
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    }
  }, async (request, reply) => {
    const parseResult = BookingSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({ errors: parseResult.error.issues });
    }

    const service = new BookingService(fastify.em);
    const result = await service.create(parseResult.data);

    if (!result.success) {
      if (result.error === 'not_found') {
        return reply.status(400).send({ message: result.message });
      }
      if (result.error === 'overlap' || result.error === 'fully_booked') {
        return reply.status(409).send({ message: result.message });
      }
      return reply.status(400).send({ message: result.message });
    }

    return reply.status(201).send(result.data);
  });
};

export default bookingRoutes;
