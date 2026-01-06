import { FastifyPluginAsync } from 'fastify';
import { ApartmentSchema, ApartmentInput, ApartmentParamsSchema } from '../schemas/apartment.schema';
import { ApartmentService } from '../services/apartment.service';
import { toJsonSchema } from '../utils/schema';

const apartmentRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', {
    schema: {
      description: 'Get all apartments',
      tags: ['Apartments'],
    },
  }, async () => {
    const service = new ApartmentService(fastify.em);
    return service.findAll();
  });

  fastify.get('/:id', {
    schema: {
      description: 'Get apartment by ID',
      tags: ['Apartments'],
      params: toJsonSchema(ApartmentParamsSchema),
    },
  }, async (request, reply) => {
    const { id } = ApartmentParamsSchema.parse(request.params);
    const service = new ApartmentService(fastify.em);
    const result = await service.findById(id);

    if (!result.success) {
      return reply.status(404).send({ message: result.message });
    }

    return result.data;
  });

  fastify.post<{ Body: ApartmentInput }>('/', {
    schema: {
      description: 'Create a new apartment',
      tags: ['Apartments'],
      body: toJsonSchema(ApartmentSchema),
    },
  }, async (request, reply) => {
    const service = new ApartmentService(fastify.em);
    const result = await service.create(request.body);

    if (!result.success) {
      return reply.status(400).send({ errors: result.details });
    }

    return reply.status(201).send(result.data);
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
    const service = new ApartmentService(fastify.em);
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
      description: 'Delete an apartment',
      tags: ['Apartments'],
      params: toJsonSchema(ApartmentParamsSchema),
    },
  }, async (request, reply) => {
    const { id } = ApartmentParamsSchema.parse(request.params);
    const service = new ApartmentService(fastify.em);
    const result = await service.delete(id);

    if (!result.success) {
      return reply.status(404).send({ message: result.message });
    }

    return reply.status(204).send();
  });
};

export default apartmentRoutes;
