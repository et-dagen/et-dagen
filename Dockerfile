# Set base image with pnpm enabled
FROM node:21-alpine AS base
RUN apk update \
    && apk upgrade \
    && corepack enable pnpm \
    && apk add --no-cache python3 make g++ zlib-dev vips-dev

# Build project
FROM base as build
WORKDIR /app
COPY . .

# Install dependencies and build the project
RUN pnpm install
RUN pnpm build

# Run the app
FROM node:21-alpine as prod
WORKDIR /app
COPY --from=build /app /app

# Enable pnpm in production environment
RUN corepack enable pnpm

# Install sharp for production in the correct environment
RUN apk add --no-cache vips-dev
RUN pnpm rebuild sharp

ENV PORT=8080
EXPOSE 8080
CMD ["node", ".output/server/index.mjs"]
