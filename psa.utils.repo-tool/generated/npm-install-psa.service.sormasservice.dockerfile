FROM node:14.17.1-alpine@sha256:cc1a31b2f4a3b8e9cdc6f8dc0c39a3b946d7aa5d10a53439d960d4352b2acfc0
RUN apk --update --no-cache add curl tzdata
RUN apk --update --no-cache add chromium ttf-dejavu ttf-liberation ttf-freefont

# Required packages for devDependencies (PACT)
RUN apk --no-cache add --virtual build-dependencies build-base bash wget \
    && wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub \
    && wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.33-r0/glibc-2.33-r0.apk \
    && apk add glibc-2.33-r0.apk
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV CYPRESS_INSTALL_BINARY=0

# required to prevent:
# could not load the shared library:dso_dlfcn.c:185:filename(libssl_conf.so): libssl_conf.so: cannot open shared object file: No such file or directory
ENV OPENSSL_CONF=/etc/ssl/

ARG DIR=.
WORKDIR /dependencies/$DIR/
COPY $DIR/package*.json ./

COPY psa.lib.service-core/ /dependencies/psa.lib.service-core/
COPY psa.eslint-config/ /dependencies/psa.eslint-config/

RUN npm ci

ENV NODE_PATH=/dependencies/$DIR/node_modules
ENV PATH=$PATH:/dependencies/$DIR/node_modules/.bin

WORKDIR /app/

# to test this dockerfile locally:
#DOCKER_BUILDKIT=1 docker build --build-arg DIR=psa.service.userservice -t psa.service.userservice -f psa.utils.repo-tool/templates/npm-install.dockerfile .
#docker run -it --rm -v $PWD/psa.service.userservice:/app/ psa.service.userservice npm run lint
