# TrendMaker — Full Railway Repo (no giant ZIP needed)

This repo runs on Railway with:
- Fastify API (ASS presets, karaoke, automontage enqueue, upload presign mock, CDN URL versioning, metrics)
- BullMQ Worker (renders a short MP4 using ffmpeg in container)
- PM2 runs API + Worker inside one service
- Redis: add a Railway Redis service and set REDIS_URL

## Quick start (Railway)
1) Create a GitHub repo and upload these files.
2) On Railway: New Project → GitHub Repo → select repo.
3) Add Service → Database → Redis → copy REDIS_URL.
4) Project → Variables → add:
   - REDIS_URL=redis://default:...@...:6379
   - (optional) AWS_REGION / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / S3_BUCKET
5) Deploy. Open the public URL:
   - `/` → health `{ ok: true }`
   - `/v1/subtitles/ass_presets`
   - `/v1/subtitles/ass_from_text` (POST JSON)
   - `/v1/automontage/render` (POST JSON) → generates a short MP4 via ffmpeg
   - `/metrics` → Prometheus text

## Local dev
- `npm i`
- `npm run start` (API)
- `npm run worker` (Worker) — requires Redis

Enjoy!
