### -----------------------
# --- Stage: development
# --- Purpose: Local dev environment (no application deps)
### -----------------------
FROM node:18-bullseye AS development

# We install a specific old node version via nvm (we explicitly want this image to be based on a newer debian version)
# https://stackoverflow.com/questions/25899912/how-to-install-nvm-in-docker
# Replace shell with bash so we can source files
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# Set debconf to run non-interactively
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections

# Install base dependencies 
RUN apt-get update && apt-get install -y -q --no-install-recommends \
    apt-transport-https \
    build-essential \
    ca-certificates \
    curl \
    git \
    # libjemalloc-dev (switch to libjemalloc https://github.com/nodejs/help/issues/1518)
    libssl-dev \
    wget \
    && rm -rf /var/lib/apt/lists/*
# && echo "/usr/lib/$(uname -m)-linux-gnu/libjemalloc.so" >> /etc/ld.so.preload

# global npm installs
RUN npm install -g grunt-cli@1.2.0 \
    && npm cache clean --force

WORKDIR /app

### -----------------------
# --- Stage: builder
# --- Purpose: Installs application deps and builds the service
### -----------------------

FROM development AS builder

# # https://github.com/krallin/tini
# # prepare init system for final image
# ENV TINI_VERSION v0.19.0
# ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
# RUN chmod +x /tini

# install server and bundler deps
COPY package.json /app/package.json
COPY yarn.lock /app/yarn.lock
RUN yarn --pure-lockfile

# install clientside deps (bower is a managed application local dev dep)
COPY bower.json /app/bower.json
COPY .bowerrc /app/.bowerrc
RUN  ./node_modules/.bin/bower install

# copy in all workspace files
COPY . /app/

# build dist
RUN grunt build

# prepare production node_modules (this cleans up dev deps)
# https://github.com/vercel/next.js/pull/23056
# https://github.com/yarnpkg/yarn/issues/6373
RUN yarn install --production --ignore-scripts --prefer-offline

### -----------------------
# --- Stage: production
# --- Purpose: Final step from a new slim image. this should be a minimal image only housing dist (production service)
### -----------------------

# nonroot or debug-nonroot (unsafe with shell)
FROM node:18-alpine AS production

# https://github.com/nodejs/docker-node/blob/7de353256a35856c788b37c1826331dbba5f0785/docs/BestPractices.md
# Node.js was not designed to run as PID 1 which leads to unexpected behaviour when running inside of Docker. 
# You can also include Tini directly in your Dockerfile, ensuring your process is always started with an init wrapper.
RUN apk add --no-cache tini

USER node
WORKDIR /app

# copy prebuilt production node_modules
COPY --chown=node:node --from=builder /app/node_modules /app/node_modules

# copy prebuilt dist
COPY --chown=node:node --from=builder /app/dist /app/dist

ENV NODE_ENV=production

EXPOSE 8080
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node","dist/server/app.js"]