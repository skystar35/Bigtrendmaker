// src/index.js
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Registry, collectDefaultMetrics, Histogram } from 'prom-client';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

import { assRoutes } from './routes/ass.js';
import { uploadRoutes } from './routes/upload.js';
import { automontageRoutes } from './routes/automontage.js';
import { cdnRoutes } from './routes/cdn.js';

const app = Fastify({ logger: false });
app.register(cors, { origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'] });

// --- Storage ---
const STORAGE_DIR = process.env.STORAGE_DIR || path.resolve('./storage');
const RENDER_DIR  = process.env.RENDER_OUTPUT_DIR || path.join(STORAGE_DIR, 'renders');
fs.mkdirSync(STORAGE_DIR, { recursive: true });
fs.mkdirSync(RENDER_DIR,  { recursive: true });

// --- Redis & Queue ---
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new IORedis(REDIS_URL);

const renderQueue = new Queue('render', { connection: redis });
console.log('Queue connected to Redis at', redis.options.host + ':' + redis.options.port);

// --- Inline Worker (ayrı servise gerek yok) ---
function run(cmd) {
  return new Promise((res, rej) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) return rej(new Error(stderr || err.message));
      res(stdout);
    });
  });
}

const renderWorker = new Worker(
  'render',
  async (job) => {
    const duration = job.data.duration || 5;
    const title = (job.data.title || 'TrendMaker').replace(/'/g, "\\'");
    const outFile = path.join(RENDER_DIR, `${job.id}.mp4`);

    const cmd =
      `ffmpeg -y -f lavfi -i color=c=black:s=720x1280:d=${duration} ` +
      `-vf "drawtext=text='${title}':fontcolor=white:fontsize=48:x=(w-tw)/2:y=(h-th)/2" ` +
      `-preset veryfast -pix_fmt yuv420p ${outFile}`;

    await run(cmd);
    return { output: outFile };
  },
  { connection: redis }
);

renderWorker.on('ready',     () => console.log('Render worker ready'));
renderWorker.on('completed', (job) => console.log('Render finished', job.id));
renderWorker.on('failed',    (job, err) => console.error('Render failed', job?.id, err?.message));

// --- Metrics ---
const registry = new Registry();
collectDefaultMetrics({ register: registry });
const httpHistogram = new Histogram({
  name: 'http_request_seconds',
  help: 'HTTP latency',
  labelNames: ['route','method','code'],
  registers: [registry]
});
app.addHook('onResponse', async (req, reply) => {
  const route = req.routerPath || req.url || 'unknown';
  httpHistogram.labels(route, req.method, String(reply.statusCode))
               .observe(Number(reply.getResponseTime())/1000);
});

// --- Health ---
app.get('/', async () => ({ ok: true, name: 'TrendMaker API (Railway full)', redis: 'configured' }));

// --- Routes ---
assRoutes(app, STORAGE_DIR);
uploadRoutes(app, STORAGE_DIR);
automontageRoutes(app, renderQueue, RENDER_DIR);
cdnRoutes(app);

// --- Metrics endpoint ---
app.get('/metrics', async (req, reply) => {
  reply.header('Content-Type', registry.contentType);
  reply.send(await registry.metrics());
});

// --- Start ---
const PORT = Number(process.env.PORT || 8080);
app.listen({ port: PORT, host: '0.0.0.0' })
  .then(() => console.log('API listening on', PORT))
  .catch(e => { console.error(e); process.exit(1); });
