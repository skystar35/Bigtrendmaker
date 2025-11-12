export function cdnRoutes(app) {
  app.post('/v1/cdn/version_url', async (req, reply) => {
    const b = req.body ?? {};
    const url = b.url || '';
    const v = b.version || Date.now().toString();
    if (!url) return { url:'' };
    const sep = url.includes('?') ? '&' : '?';
    return { url: `${url}${sep}v=${encodeURIComponent(v)}` };
  });
}
// src/routes/cdn.js
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
  // Render edilmiş videoların bulunduğu klasör
  const renderDir = process.env.RENDER_OUTPUT_DIR || path.join('./storage', 'renders');

  // Klasör yoksa oluştur
  fs.mkdirSync(renderDir, { recursive: true });

  // /cdn/renders/* altındaki dosyaları statik olarak sun
  app.register(fastifyStatic, {
    root: renderDir,
    prefix: '/cdn/renders/', // 💡 URL başlangıcı
    decorateReply: false
  });

  // Basit kontrol endpointi (isteğe bağlı)
  app.get('/cdn/check', async () => ({ ok: true, folder: renderDir }));
}
