import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import websocketPlugin from '@fastify/websocket';

import authRouter from './routes/auth.routes.js';
import stockRoutes from './routes/stock.routes.js';
import { getEnvVar } from './utils/getEnvVar.js';
import { initMongoConnection } from './plugins/db.js';
import wsPlugin from './plugins/websocket.js';

const PORT = Number(getEnvVar('PORT', '5000'));
const app = Fastify({ logger: true });

await initMongoConnection();

await app.register(cors, { origin: '*' });
await app.register(sensible);
await app.register(websocketPlugin);
await app.register(wsPlugin);

await app.register(authRouter, { prefix: '/auth' });
await app.register(stockRoutes);

app.listen({ port: PORT }, err => {
  if (err) app.log.error(err);
  app.log.info(`🚀  Server ready on http://localhost:${PORT}`);
});
