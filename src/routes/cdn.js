// src/routes/cdn.js
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

export function cdnRoutes(app) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Worker'ın video kaydettiği dizinle birebir aynı olmalı
  const RENDER_DIR = path.resolve('./storage/renders');
  fs.mkdirSync(RENDER_DIR, { recursive: true });

  app.register(fastifyStatic, {
    root: RENDER_DIR,
    prefix: '/cdn/renders/',
    decorateReply: false
  });

  app.get('/cdn/*', async (req, reply) => {
    reply.code(404).send({ ok: false, error: 'not_found' });
  });
}
