# ── Stage 1: build ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma/ ./prisma/
COPY prisma.config.ts ./

RUN npm install

# Gerar o Prisma Client
RUN npx prisma generate

COPY src/ ./src/

# Compilar TypeScript → dist/
RUN npx tsc --project tsconfig.json

# ── Stage 2: runtime ────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma/ ./prisma/
COPY prisma.config.ts ./

# Apenas dependências de produção
RUN npm install --omit=dev

# Regenerar o Prisma Client no runtime
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3003

ENTRYPOINT ["./docker-entrypoint.sh"]
