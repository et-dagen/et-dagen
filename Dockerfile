# Set base image with pnpm enabled
FROM node:21-alpine AS base
RUN apk update \
    && apk upgrade \
    && corepack enable pnpm

RUN corepack prepare pnpm@8.6.0 --activate

# Build project
FROM base AS build
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm build

# Run
FROM node:21-alpine AS prod
WORKDIR /app
COPY --from=build /app /app
ENV PORT=8080
EXPOSE 8080
CMD ["node", ".output/server/index.mjs"]
