
'use strict';

/**
 * @author Excepts
 * @since 2021/05/12.
 */

import log4js from 'koa-log4';
import BaseHandler from './base';

const logger = log4js.getLogger('babel-koa');


export default class ModuleHandler extends BaseHandler {

    constructor(envoy) {
        super(envoy);
    }
}