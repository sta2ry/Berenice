
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

const origins = context.config.server.response.headers.origin;

const app = new KOA();

const _use = app.use;

const logger = log4js.getLogger(context.config.name);

app.use = (x) => _use.call(app, convert(x));
// middlewares
app.use(log4js.koaLogger(log4js.getLogger('http'), { level: 'auto' }));
app.use(body());
app.use(json());

// request perform log
app.use(async (ctx, next) => {
    const start = new Date();
    await next();
    const ms = new Date() - start;
    logger.info(`- Perform Log: ${ctx.method} ${ctx.url} - ${ms}ms`);
});

app.use(cors({origin: function (ctx) {
        const index = origins.indexOf(ctx.request.headers.origin)
        if ( index !== -1) {
            return origins[index]
        }
    }}));

// response router
app.use(moduleRouter.routes()).use(moduleRouter.allowedMethods());
// 404
app.use(async (ctx) => {
    ctx.status = 404;
    logger.warn('cannot find resource %s', ctx.request.originalUrl)
});

// error logger
app.on('error', async (err, ctx) => {
    logger.error('error occured:', err);
});

// context.listen(process.env.PORT || 5000);
const port = parseInt(context.config.port || process.env.PORT || '5000');

const server = http.createServer(app.callback());

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
    logger.info('Listening on port: %d', port);
});

export default app;