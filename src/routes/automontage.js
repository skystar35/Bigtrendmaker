// src/routes/automontage.js
import fs from 'fs';
import path from 'path';

export function automontageRoutes(app, renderQueue, RENDER_DIR) {
  // İş oluştur
  app.post('/v1/automontage/render', async (req, reply) => {
    if (!renderQueue) {
      return reply.code(503).send({ ok: false, error: 'queue_unavailable' });
    }

    const { title = 'TrendMaker', duration = 5, format = 'mp4' } = req.body || {};
    const job = await renderQueue.add('render', { title, duration, format });
    return { ok: true, jobId: job.id, status: 'queued' };
  });

  // Durum sorgu
app.get('/v1/automontage/status/:id', async (req, reply) => {
  if (!renderQueue) {
    return reply.code(503).send({ ok: false, error: 'queue_unavailable' });
  }

  const id = req.params.id;
  const job = await renderQueue.getJob(id);
  if (!job) return reply.code(404).send({ ok: false, error: 'job_not_found' });

  const state = await job.getState();
  const out = job.returnvalue?.output;

  const res = { ok: true, state };
  if (state === 'completed' && out) {
    const ext = path.extname(out).slice(1) || 'mp4';
    res.url = `/cdn/renders/${id}.${ext}`;
  }
  if (state === 'failed') res.error = job.failedReason || 'failed';

  return reply.send(res);
});
