export const validateBody = (schema) => {
    return async (request, reply) => {
      try {
        await schema.validateAsync(request.body, { abortEarly: false });
      } catch (error) {
        const errors = error.details.map(detail => detail.message);
        reply.badRequest(errors.join('; '));
      }
    };
  };