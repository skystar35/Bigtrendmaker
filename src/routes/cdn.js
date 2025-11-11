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
