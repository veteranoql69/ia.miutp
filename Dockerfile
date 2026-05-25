# Etapa 1: Base
FROM node:20-alpine AS base

# Etapa 2: Dependencias
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Instalar dependencias basadas en el lockfile
COPY package.json package-lock.json* ./
RUN npm ci

# Etapa 3: Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time.
# They MUST be passed as build-args from CI/Portainer — runtime env vars won't work on client components.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY=$NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Etapa 4: Runner (Producción)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Crear directorio .next y ajustar permisos para la caché
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Aprovechar output tracing para optimizar tamaño de la imagen standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
