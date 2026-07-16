# Wireframe Protocol — container with Node + ffmpeg
FROM node:20-slim

# ffmpeg is needed for the animated-GIF feature
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# install deps first (better layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# app code + assets
COPY . .

ENV NODE_ENV=production
# The server reads process.env.PORT (Render/Railway/Fly set this automatically)
EXPOSE 3000

CMD ["npm", "start"]
