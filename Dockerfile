# Base off Alpine Linux
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install pnpm (Important for building)
RUN npm install --location=global pnpm

RUN pnpm install

RUN pnpm build

# Copy build files
COPY . .

ENV PORT=8080

# Expose port 8080 to outside world
EXPOSE 8080

CMD ["pnpm", "start"]
