// src/routes/cdn.js
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

export function cdnRoutes(app) {
  // Klasörleri garantiye al
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), 'storage');
  const RENDER_DIR  = process.env.RENDER_OUTPUT_DIR || path.join(STORAGE_DIR, 'renders');
  fs.mkdirSync(RENDER_DIR, { recursive: true });

  // /cdn/renders/* altında statik yayınla (örn: /cdn/renders/4.mp4)
  app.register(fastifyStatic, {
    root: RENDER_DIR,
    prefix: '/cdn/renders/',
    decorateReply: false,
  });
}
