// src/routes/cdn.js
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

export function cdnRoutes(app) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const STORAGE_DIR = process.env.STORAGE_DIR || path.resolve('./storage');
  const RENDER_DIR = process.env.RENDER_OUTPUT_DIR || path.join(STORAGE_DIR, 'renders');

  fs.mkdirSync(RENDER_DIR, { recursive: true });

  console.log('📦 Serving static renders from:', RENDER_DIR);

  app.register(fastifyStatic, {
    root: RENDER_DIR,
    prefix: '/cdn/renders/',
    decorateReply: false,
  });

  // 🧩 Debug endpoint — render dosyalarını listeler
  app.get('/debug/renders', async (req, reply) => {
    try {
      const files = fs.readdirSync(RENDER_DIR);
      return reply.send({ ok: true, dir: RENDER_DIR, files });
    } catch (e) {
      return reply.code(500).send({ ok: false, error: e.message, dir: RENDER_DIR });
    }
  });

  app.get('/cdn/*', async (req, reply) => {
    reply.code(404).send({ ok: false, error: 'not_found' });
  });
}
