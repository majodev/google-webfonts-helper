### -----------------------
# --- Stage: development
# --- Purpose: Local dev environment (no application deps)
### -----------------------
FROM debian:bullseye AS development

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
    libssl-dev \
    wget \
    && rm -rf /var/lib/apt/lists/*

# rootless node, user node
ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

RUN groupadd --gid $USER_GID $USERNAME \
    && useradd -s /bin/bash --uid $USER_UID --gid $USER_GID -m $USERNAME

USER ${USERNAME}

ENV NVM_DIR /home/node/.nvm
ENV NODE_VERSION 0.10.44

# Install nvm with node and npm
RUN mkdir -p $NVM_DIR \
    && curl https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash \
    && . $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default

ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/v$NODE_VERSION/bin:$PATH

# global npm installs
RUN npm install -g grunt-cli@1.2.0 \
    && npm cache clean --force  

WORKDIR /app

### -----------------------
# --- Stage: builder
# --- Purpose: Installs application deps and builds the service
### -----------------------

FROM development AS builder

# install server and bundler deps
COPY --chown=${USERNAME}:${USERNAME} package.json /app/package.json
COPY --chown=${USERNAME}:${USERNAME} npm-shrinkwrap.json /app/npm-shrinkwrap.json
RUN npm install -d

# install clientside deps (bower is a managed application local dev dep)
COPY --chown=${USERNAME}:${USERNAME} bower.json /app/bower.json
COPY --chown=${USERNAME}:${USERNAME} .bowerrc /app/.bowerrc
RUN  ./node_modules/.bin/bower install

# copy in all workspace files
COPY --chown=${USERNAME}:${USERNAME} . /app/

# build dist
RUN grunt build
# prepare production node_modules and remove all globally installed deps incl. npm itself
RUN npm prune --production && npm uninstall -g grunt-cli npm

### -----------------------
# --- Stage: production
# --- Purpose: Final step from a new slim image.this should be a minimal image only housing dist (production service)
### -----------------------

# nonroot or debug-nonroot (unsafe with shell)
FROM gcr.io/distroless/base-debian11:nonroot AS production

USER nonroot
WORKDIR /app

# copy prebuilt node from builder base image
ENV NVM_DIR /home/node/.nvm
ENV NODE_VERSION 0.10.44
ENV NODE_PATH /app/node/lib/node_modules
ENV PATH      /app/node/bin:$PATH
COPY --chown=nonroot:nonroot --from=builder $NVM_DIR/v$NODE_VERSION /app/node

# shared dyn libs: nodejs requirements
COPY --chown=nonroot:nonroot --from=builder /usr/lib/x86_64-linux-gnu/libstdc++.so.* /usr/lib/x86_64-linux-gnu/
COPY --chown=nonroot:nonroot --from=builder /lib/x86_64-linux-gnu/libgcc_s.so.* /lib/x86_64-linux-gnu/
COPY --chown=nonroot:nonroot --from=builder /usr/lib/gcc/x86_64-linux-gnu/10/*.so* /usr/lib/gcc/x86_64-linux-gnu/10/

# copy prebuilt production node_modules
COPY --chown=nonroot:nonroot --from=builder /app/node_modules /app/node_modules

# copy prebuilt dist
COPY --chown=nonroot:nonroot --from=builder /app/dist /app/dist

ENV NODE_ENV=production

EXPOSE 8080
ENTRYPOINT [ "/app/node/bin/node" ]
CMD ["dist/server/app.js"]
