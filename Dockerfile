FROM node:20

# tools
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .

# pm2 for multi-process (api + worker)
RUN npm i -g pm2

ENV PORT=8080
ENV STORAGE_DIR=/app/storage
ENV RENDER_OUTPUT_DIR=/app/storage/renders
# REDIS_URL should be provided by Railway; fallback to local if not set
ENV REDIS_URL=${REDIS_URL:-redis://localhost:6379}

EXPOSE 8080

CMD ["node","src/index.js"]
