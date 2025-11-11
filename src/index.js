import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Registry, collectDefaultMetrics, Histogram } from 'prom-client';
import { createClient } from 'redis';
import { Queue } from 'bullmq';
import { assRoutes } from './routes/ass.js';
import { uploadRoutes } from './routes/upload.js';
import { automontageRoutes } from './routes/automontage.js';
import { cdnRoutes } from './routes/cdn.js';
import fs from 'fs';
import path from 'path';

const app = Fastify({ logger: false });
app.register(cors, { origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'] });

// Storage
const STORAGE_DIR = process.env.STORAGE_DIR || './storage';
const RENDER_DIR = process.env.RENDER_OUTPUT_DIR || path.join(STORAGE_DIR, 'renders');
fs.mkdirSync(STORAGE_DIR, { recursive: true });
fs.mkdirSync(RENDER_DIR, { recursive: true });

// Queue
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new URL(REDIS_URL);
const renderQueue = new Queue('render', { connection: { host: connection.hostname, port: parseInt(connection.port||'6379'), password: connection.password?.replace(/^:/,'') } });

// Metrics
const registry = new Registry();
collectDefaultMetrics({ register: registry });
const httpHistogram = new Histogram({ name:'http_request_seconds', help:'HTTP latency', labelNames:['route','method','code'], registers:[registry] });

app.addHook('onResponse', async (req, reply) => {
  const route = req.routerPath || req.url || 'unknown';
  httpHistogram.labels(route, req.method, String(reply.statusCode)).observe(Number(reply.getResponseTime())/1000);
});

// Health
app.get('/', async () => ({ ok:true, name:'TrendMaker API (Railway full)', redis: REDIS_URL ? 'configured' : 'missing' }));

// Routes
assRoutes(app, STORAGE_DIR);
uploadRoutes(app, STORAGE_DIR);
automontageRoutes(app, renderQueue, RENDER_DIR);
cdnRoutes(app);

// Metrics
app.get('/metrics', async (req, reply) => {
  reply.header('Content-Type', registry.contentType);
  reply.send(await registry.metrics());
});

const PORT = process.env.PORT || 8080;
app.listen({ port: Number(PORT), host:'0.0.0.0' })
  .then(()=> console.log('API listening on', PORT))
  .catch(e=> { console.error(e); process.exit(1); });
