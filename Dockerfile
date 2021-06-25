#++++++++++++++++++++++++++++++++++++++++++++#
#    Babel-Koa Docker container in Alpine    #
#+++++++++++++++++++++++++++++++++++++++++++#

FROM node:15-alpine as builder
LABEL vendor=Featx
MAINTAINER Excepts <ex7ept@featx.org>

ARG APP_VERSION=1.0.0
ENV APP_HOME=/mnt/app/babel-koa \
    NODE_ENV=production

COPY src $APP_HOME/src/
COPY package.json $APP_HOME/

WORKDIR $APP_HOME

RUN apk add --no-cache --virtual .build-deps build-base git ca-certificates tzdata &&\
    npm i --dev --include=dev &&\
    ./node_modules/.bin/babel src --out-dir dest


FROM node:15-alpine
LABEL vendor=Featx
MAINTAINER Excepts <ex7ept@featx.org>

ARG APP_VERSION=1.0.0
ARG GOSU_VERSION=1.12
ENV APP_HOME=/mnt/app/babel-koa \
    NODE_ENV=production

COPY --from=builder $APP_HOME/dest  $APP_HOME/dest/
COPY package.json $APP_HOME/
COPY config $APP_HOME/config/

WORKDIR $APP_HOME
RUN set -ex &&\
    apk add -U curl gnupg &&\
    cp config/* /tmp/ &&\
    npm i &&\
    export GNUPGHOME="$(mktemp -d)" &&\
    for server in $(shuf -e ha.pool.sks-keyservers.net \
                            hkp://p80.pool.sks-keyservers.net:80 \
                            keyserver.ubuntu.com \
                            hkp://keyserver.ubuntu.com:80 \
                            pgp.mit.edu) ; do \
        gpg --batch --keyserver "$server" --recv-keys F1182E81C792928921DBCAB4CFCA4A29D26468DE &&\
        gpg --batch --keyserver "$server" --recv-keys B42F6819007F00F88E364FD4036A9C25BF357DD4 && break || : ; \
    done &&\
    # Grab gosu for easy step-down from root
    curl -o /usr/local/bin/gosu -fSL https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-amd64 &&\
    curl -o /usr/local/bin/gosu.asc -fSL https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-amd64.asc &&\
    gpg --batch --verify /usr/local/bin/gosu.asc /usr/local/bin/gosu &&\
    chmod +x /usr/local/bin/gosu &&\
    gosu nobody true &&\
    # dispose
    apk del gnupg && rm -rf /var/cache/apk/* "$GNUPGHOME" /usr/local/bin/gosu.asc &&\
    echo -e '#!/bin/sh\n\
\n\
set -e\n\
\n\
mkdir -p $APP_HOME/log $APP_HOME/config $APP_HOME/wallet $APP_HOME/address \n\
\n\
if [ ! -f $APP_HOME/config/config.json ]; then\n\
    cp -r /tmp/*  $APP_HOME/config/\n\
fi\n\
\n\
exec gosu node "$@"' >> /usr/bin/entry &&\
    chmod u+x /usr/bin/entry &&\
    chown -R node:node $APP_HOME

#USER node
VOLUME /mnt/app/babel-koa/config /mnt/app/babel-koa/log
HEALTHCHECK --interval=10s --timeout=3s --retries=3 CMD curl http://127.0.0.1:8081/
EXPOSE 8081
ENTRYPOINT ["/usr/bin/entry"]
CMD ["node", "dest/app.js"]