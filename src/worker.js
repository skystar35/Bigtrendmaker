import { Worker } from 'bullmq';
import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new URL(REDIS_URL);
const storage = process.env.RENDER_OUTPUT_DIR || './storage/renders';
fs.mkdirSync(storage, { recursive: true });

function run(cmd) {
  return new Promise((res, rej)=> {
    exec(cmd, (err, stdout, stderr)=> {
      if (err) return rej(new Error(stderr || err.message));
      res(stdout);
    });
  });
}

const w = new Worker('render', async job => {
  const duration = job.data.duration || 5;
  const filename = path.join(storage, `${job.id}.mp4`);
  const text = (job.data.title || 'TrendMaker').replace(/'/g,"\\'");
  const cmd = `ffmpeg -y -f lavfi -i color=c=black:s=720x1280:d=${duration} -vf "drawtext=text='${text}':fontcolor=white:fontsize=48:x=(w-tw)/2:y=(h-th)/2" -preset veryfast -pix_fmt yuv420p ${filename}`;
  await run(cmd);
  return { output: filename };
}, { connection: { host: connection.hostname, port: parseInt(connection.port||'6379'), password: connection.password?.replace(/^:/,'') } });

w.on('ready', ()=> console.log('Render worker ready'));
w.on('failed', (job, err)=> console.error('Render failed', job?.id, err.message));
