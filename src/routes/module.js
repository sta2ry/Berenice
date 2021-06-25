
'use strict';

/**
 * @author Excepts
 * @since 2021/05/12.
 */

import Router from 'koa-router';
import context from '../context/context';

const moduleHandler = context.module('handler.module');

const router = new Router({prefix: '/module'});

router.get('/', async (ctx) => {
    ctx.body = await moduleHandler.block(ctx.request.query.height, ctx.request.query.hash);
});
router.post('/transaction', async (ctx) => {
    const body = await ctx.request.body
    ctx.body = await moduleHandler.transaction(body);
});
router.use(router.routes());

export default router;