
'use strict';

/**
 * @author Excepts
 * @since 2021/05/08.
 */

// import log4js from 'koa-log4';

import context from './config';
import ModuleHandler from '../handler/module';


// const logger = log4js.getLogger(context.config.name);

context.register('handler.module', new ModuleHandler());

export default context;