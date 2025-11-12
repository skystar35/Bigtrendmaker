// src/routes/cdn.js
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';

export function cdnRoutes(app) {
  const RENDER_DIR = path.resolve('./storage/renders');
  fs.mkdirSync(RENDER_DIR, { recursive: true });

  app.register(fastifyStatic, {
    root: RENDER_DIR,
    prefix: '/cdn/renders/',
    decorateReply: false,
    index: false,
    list: false,
  });

  // İsteğe bağlı sağlık kontrolü
  app.get('/cdn/health', async () => ({ ok: true }));
}
