# Stage 1: Build the app
FROM node:alpine AS builder

WORKDIR /app

# Copy only the package.json and yarn.lock files to leverage Docker cache
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN apk update && yarn global add pnpm

# Install dependencies with PNPM
RUN pnpm install --prod

# Copy the entire app source code
COPY . .

# Build the app with PNPM
RUN pnpm build

# Stage 2: Create the production image
FROM node:alpine

WORKDIR /app

# Copy only the necessary files from the previous stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Start the Nuxt app
CMD ["pnpm", "start"]