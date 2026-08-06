# Build project with bun (node kept available for tooling that shells out to it)
FROM oven/bun:1.3.14-alpine AS build
RUN apk update \
    && apk upgrade \
    && apk add --no-cache nodejs

WORKDIR /app
COPY . .

# Install dependencies and build the project
RUN bun install --frozen-lockfile
RUN bun run build

# Run
FROM node:22-alpine AS prod

WORKDIR /app
COPY --from=build /app/.output /app/.output

ENV PORT=8080
EXPOSE 8080
CMD ["node", ".output/server/index.mjs"]
