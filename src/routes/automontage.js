import { nanoid } from 'nanoid';

export function automontageRoutes(app, queue, renderDir) {
  app.post('/v1/automontage/render', async (req, reply) => {
    const b = req.body ?? {};
    const job = await queue.add('render', {
      title: b.title || 'TrendMaker Render',
      duration: Math.max(3, Math.min(30, Number(b.duration||5)))
    }, { jobId: b.jobId || nanoid(), removeOnComplete: 100, removeOnFail: 500 });
    return { ok:true, jobId: job.id, status:'queued' };
  });

  app.get('/v1/automontage/status/:id', async (req, reply) => {
    const id = req.params.id;
    const job = await queue.getJob(id);
    if (!job) return reply.code(404).send({ ok:false, error:'job_not_found' });
    const state = await job.getState();
    const result = await job.getReturnValue();
    return { ok:true, state, result };
  });
}
