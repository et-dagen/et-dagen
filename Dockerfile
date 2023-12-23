# Set base image with pnpm enabled
FROM node:20-alpine AS base
RUN apk update \
    && apk upgrade \
    && corepack enable pnpm

# Build project
FROM base as build
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm build

# Run
FROM node:20-alpine as prod
WORKDIR /app
COPY --from=build /app /app
ENV PORT=8080
EXPOSE 8080
CMD ["node", ".output/server/index.mjs"]
