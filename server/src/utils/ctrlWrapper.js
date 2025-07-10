export const ctrlWrapper = (ctrl) => {
    return async (req, reply) => {
      try {
        await ctrl(req, reply);
      } catch (error) {
        reply.send(error);
      }
    };
  };