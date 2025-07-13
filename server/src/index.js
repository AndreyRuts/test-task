import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';

import authRouter from './routes/auth.routes.js';
import stockRoutes from './routes/stock.routes.js';
import { getEnvVar } from './utils/getEnvVar.js';
import { initMongoConnection } from './plugins/db.js';
import { initWSS } from './plugins/websocket.js';

const PORT = Number(getEnvVar('PORT', '5000'));
const app = Fastify({ logger: true });

await initMongoConnection();
await app.register(cors, { origin: '*' });
await app.register(sensible);

await app.register(authRouter, { prefix: '/auth' });
await app.register(stockRoutes);

await app.listen({ port: PORT });
app.log.info(`🚀  Server ready on http://localhost:${PORT}`);

// Здесь берем нативный Node.js HTTP сервер из Fastify
const server = app.server;

// Инициализируем WebSocket сервер поверх нативного HTTP сервера
initWSS(server, app.log);
