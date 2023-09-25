FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./
RUN yarn global add pnpm && pnpm i --frozen-lockfile --filter=!artillery

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables must be present at build time
ENV NODE_ENV production
ENV ENVIRONMENT_NAME stage

RUN yarn global add pnpm
RUN pnpm build

RUN rm -rf node_modules && pnpm i --prod --frozen-lockfile && pnpm store prune

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

# Environment variables must be redefined at run time
ENV NODE_ENV production
ARG ENVIRONMENT_NAME
ENV ENVIRONMENT_NAME=${ENVIRONMENT_NAME}
ARG HTTP_PORT
ENV HTTP_PORT=${HTTP_PORT}
ARG APP_NAME
ENV APP_NAME=${APP_NAME}

# For migration and seeding
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/src ./src

# Copy code output and node_modules prod from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "dist/main.js"]
