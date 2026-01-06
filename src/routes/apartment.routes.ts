import { FastifyPluginAsync } from 'fastify';
import { Apartment } from '../entities/apartment.entity';
import { AccommodationType } from '../entities/accommodation.entity';
import { ApartmentSchema, ApartmentInput, ApartmentParamsSchema } from '../schemas/apartment.schema';
import { toJsonSchema } from '../utils/schema';

const apartmentRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', {
    schema: {
      description: 'Get all apartments',
      tags: ['Apartments'],
    },
  }, async () => {
    return await fastify.em.find(Apartment, {});
  });

  fastify.get('/:id', {
    schema: {
      description: 'Get apartment by ID',
      tags: ['Apartments'],
      params: toJsonSchema(ApartmentParamsSchema),
    },
  }, async (request, reply) => {
    const { id } = ApartmentParamsSchema.parse(request.params);
    const apartment = await fastify.em.findOne(Apartment, { id });

    if (!apartment) {
      return reply.status(404).send({ message: 'Apartment not found' });
    }

    return apartment;
  });

  fastify.post<{ Body: ApartmentInput }>('/', {
    schema: {
      description: 'Create a new apartment',
      tags: ['Apartments'],
      body: toJsonSchema(ApartmentSchema),
    },
  }, async (request, reply) => {
    const validationResult = ApartmentSchema.safeParse(request.body);

    if (!validationResult.success) {
      return reply.status(400).send({ errors: validationResult.error.errors });
    }

    const apartment = fastify.em.create(Apartment, {
      ...validationResult.data,
      type: AccommodationType.APARTMENT,
    });
    await fastify.em.persistAndFlush(apartment);
    return reply.status(201).send(apartment);
  });

  fastify.put<{ Body: ApartmentInput }>('/:id', {
    schema: {
      description: 'Update an apartment',
      tags: ['Apartments'],
      params: toJsonSchema(ApartmentParamsSchema),
      body: toJsonSchema(ApartmentSchema),
    },
  }, async (request, reply) => {
    const { id } = ApartmentParamsSchema.parse(request.params);
    const apartment = await fastify.em.findOne(Apartment, { id });

    if (!apartment) {
      return reply.status(404).send({ message: 'Apartment not found' });
    }

    const validationResult = ApartmentSchema.safeParse(request.body);

    if (!validationResult.success) {
      return reply.status(400).send({ errors: validationResult.error.errors });
    }

    fastify.em.assign(apartment, validationResult.data);
    await fastify.em.flush();
    return apartment;
  });

  fastify.delete('/:id', {
    schema: {
      description: 'Delete an apartment',
      tags: ['Apartments'],
      params: toJsonSchema(ApartmentParamsSchema),
    },
  }, async (request, reply) => {
    const { id } = ApartmentParamsSchema.parse(request.params);
    const apartment = await fastify.em.findOne(Apartment, { id });

    if (!apartment) {
      return reply.status(404).send({ message: 'Apartment not found' });
    }

    await fastify.em.removeAndFlush(apartment);
    return reply.status(204).send();
  });
};

export default apartmentRoutes;
