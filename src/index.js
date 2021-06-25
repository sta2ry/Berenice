
'use strict';

/**
 * @author Ex7ept
 * @since 2021/05/07.
 */

/** Module import as order: system, third-party, local */
import "core-js/stable";
import "regenerator-runtime/runtime";
import http from 'http';

import KOA from 'koa';
import log4js from 'koa-log4';
import convert from 'koa-convert';
import body from 'koa-body';
import json from 'koa-json';
import cors from 'koa2-cors';

import context from './context/context';
import moduleRouter from './routes/module';

class Application {

    app = new KOA();
    _use = this.app.use;
    logger = null;

    async init() {
        this.app.use = (x) => this._use.call(this.app, convert(x));
        await context.bootstrap();

        this.logger = log4js.getLogger(context.config.name);

        // middlewares
        this.app.use(log4js.koaLogger(log4js.getLogger('http'), { level: 'auto' }));
        this.app.use(body());
        this.app.use(json());

        // request perform log
        this.app.use(async (ctx, next) => {
            const start = new Date();
            await next();
            const ms = new Date() - start;
            this.logger.info(`- Perform Log: ${ctx.method} ${ctx.url} - ${ms}ms`);
        });

        const origins = context.config.server.response.headers.origin;
        this.app.use(cors({origin: function (ctx) {
            const index = origins.indexOf(ctx.request.headers.origin);
            if ( index !== -1) {
                return origins[index]
            }
        }}));
        // response router
        this.app.use(moduleRouter.routes()).use(moduleRouter.allowedMethods());
        // 404
        this.app.use(async (ctx) => {
            ctx.status = 404;
            this.logger.warn('cannot find resource %s', ctx.request.originalUrl)
        });

        // error logger
        this.app.on('error', async (err, ctx) => {
            this.logger.error('error occured:', err);
        });
        return this;
    }

    async start() {
        // context.listen(process.env.PORT || 5000);
        const port = parseInt(context.config.port || process.env.PORT || '5000');

        const server = http.createServer(this.app.callback());

        server.listen(port);

        server.on('error', (error) => {
            if (error.syscall !== 'listen') {
                throw error;
            }
            // handle specific listen errors with friendly messages
            switch (error.code) {
                case 'EACCES':
                    logger.error(port + ' requires elevated privileges');
                    process.exit(1);
                    break;
                case 'EADDRINUSE':
                    logger.error(port + ' is already in use');
                    process.exit(1);
                    break;
                default:
                    throw error;
            }
        });
        server.on('listening', () => {
            this.logger.info('Listening on port: %d', port);
        });
        return this;
    }
}

export default new Application().init().then(a=>a.start())
    .catch(e=>console.error(e))