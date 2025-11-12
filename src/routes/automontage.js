// routes/automontage.js
import { Router } from 'find-my-way'; // fastify kullanıyoruz; alttaki kullanım fastify tarzında

export function automontageRoutes(app, renderQueue, RENDER_DIR) {
  // 1) İş oluştur
  app.post('/v1/automontage/render', async (req, reply) => {
    if (!renderQueue) return reply.code(503).send({ ok: false, error: 'queue_unavailable' });

    const body = req.body || {};
    // Örnek: sadece basit parametreler; istersen images/prompts ekleyebilirsin
    const job = await renderQueue.add('render', {
      title: body.title || 'TrendMaker',
      duration: Number(body.duration || 5)
    });

    return reply.send({ ok: true, jobId: job.id, status: 'queued' });
  });

  // 2) Durum sor
  app.get('/v1/automontage/status/:id', async (req, reply) => {
    if (!renderQueue) return reply.code(503).send({ ok: false, error: 'queue_unavailable' });

    const job = await renderQueue.getJob(req.params.id);
    if (!job) return reply.code(404).send({ ok: false, error: 'job_not_found' });

    const state = await job.getState(); // waiting, active, completed, failed, delayed, paused
    const progress = job.progress || 0;
    const result = job.returnvalue || null;

    return reply.send({ ok: true, state, progress, result });
  });

  // 3) Çıktı linki (worker mp4 yolunu döndürüyor)
  app.get('/v1/automontage/result/:id', async (req, reply) => {
    if (!renderQueue) return reply.code(503).send({ ok: false, error: 'queue_unavailable' });

    const job = await renderQueue.getJob(req.params.id);
    if (!job) return reply.code(404).send({ ok: false, error: 'job_not_found' });

    const state = await job.getState();
    if (state !== 'completed') {
      return reply.code(409).send({ ok: false, error: 'not_ready', state });
    }

    const { output } = job.returnvalue || {};
    if (!output) return reply.code(500).send({ ok: false, error: 'missing_output' });

    // İstersen burada dosyayı doğrudan servis edebilirsin:
    // return reply.type('video/mp4').send(fs.createReadStream(output));

    // veya sadece yolunu ver
    return reply.send({ ok: true, path: output });
  });
}
