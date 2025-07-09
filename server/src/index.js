import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';

// import authRoutes from './routes/auth.routes.js';
import { getEnvVar } from './utils/getEnvVar.js';
import { initMongoConnection } from './plugins/db.js';

const PORT = Number(getEnvVar('PORT', '5000'));

const app = Fastify({ logger: true });

await initMongoConnection();

await app.register(cors, { origin: '*' });
await app.register(sensible);

// await app.register(authRoutes, { prefix: '/api' });


app.listen({ port: PORT }, err => {
  if (err) app.log.error(err);
  app.log.info(`🚀  Server ready on http://localhost:${PORT}`);
});
