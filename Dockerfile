FROM node:20-alpine AS build

# update and install the latest dependencies for the alpine version
RUN apk update && apk upgrade

# set work dir as app
WORKDIR /app
# copy the nuxt project package json and package json lock if available 
COPY package* ./
# install all the project npm dependencies
RUN  yarn global add pnpm
RUN  pnpm install
# copy all other project files to working directory
COPY . ./
# build the nuxt project to generate the artifacts in .output directory
RUN pnpm start

# we are using multi stage build process to keep the image size as small as possible
FROM node:20-alpine
# update and install latest dependencies, add dumb-init package
# add a non root user
RUN apk update && apk upgrade && apk add dumb-init && adduser -D nuxtuser 
# set non root user
USER nuxtuser

# set work dir as app
WORKDIR /app
# copy the output directory to the /app directory from 
# build stage with proper permissions for user nuxt user
COPY --chown=nuxtuser:nuxtuser --from=build /app/.output ./
# expose 8080 on container
EXPOSE 8080

# set app host and port . In nuxt 3 this is based on nitro and you can read
#more on this https://nitro.unjs.io/deploy/node#environment-variables
ENV HOST=0.0.0.0 PORT=8080 NODE_ENV=production
# start the app with dumb init to spawn the Node.js runtime process
# with signal support
CMD ["dumb-init","node", ".output/server/index.mjs"]