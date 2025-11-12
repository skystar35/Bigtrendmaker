// src/routes/cdn.js
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

export function cdnRoutes(app) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const STORAGE_DIR = process.env.STORAGE_DIR || './storage';
  const RENDER_DIR = process.env.RENDER_OUTPUT_DIR || path.join(STORAGE_DIR, 'renders');

  fs.mkdirSync(RENDER_DIR, { recursive: true });

  app.register(fastifyStatic, {
    root: path.resolve(RENDER_DIR),
    prefix: '/cdn/renders/', // örn: /cdn/renders/4.mp4
    decorateReply: false
  });

  app.get('/cdn/*', async (req, reply) => {
    reply.code(404).send({ ok: false, error: 'not_found' });
  });
}
