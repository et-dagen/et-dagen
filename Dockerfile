FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install --location=global pnpm

RUN pnpm install

RUN pnpm build

COPY . .

ENV PORT=8080

EXPOSE 8080

CMD ["pnpm", "start"]
