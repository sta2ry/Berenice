'use strict';

/**
 * The application empty context, only serialize config.json into class/object.
 *
 * Since we cannot initialize services in the same js file,
 * it's required to import context.js in order to use context's services.
 *
 *   *Reason: e.g. if Service A would depend on the config in context, A should
 *   import context, then context cannot import A to make a circle dependencies.
 *
 * @author Excepts
 * @since 2021/05/08.
 */

import path from 'path';
import log4js from 'koa-log4';
import {NacosConfigClient, NacosNamingClient} from "nacos";

import config from '../../config/config.json';


log4js.configure(config.log4js, {cwd: config.log4js.cwd});
const logger = log4js.getLogger('babel-koa');


const refactorConfig = (cfg) => {
    let resultConfig = cfg;
    resultConfig.path.root = cfg.path.root ?
        cfg.path.root.replaceAll("${pwd}", __dirname + "/..") :
        path.join(__dirname, '../../..');
    if (process.platform === 'win32') {
        if (resultConfig.path.client.indexOf(':\\') !== 1) {
            resultConfig.path.client = path.join(resultConfig.path.root, resultConfig.path.client);
        }
        if (resultConfig.path.server.indexOf(':\\') !== 1) {
            resultConfig.path.server = path.join(resultConfig.path.root, resultConfig.path.server);
        }
        if (resultConfig.path.resources.indexOf(':\\') !== 1) {
            resultConfig.path.resources = path.join(resultConfig.path.root, resultConfig.path.resources);
        }
    } else {
        if (resultConfig.path.client.indexOf('/') !== 0) {
            resultConfig.path.client = path.join(resultConfig.path.root, resultConfig.path.client);
        }
        if (resultConfig.path.server.indexOf('/') !== 0) {
            resultConfig.path.server = path.join(resultConfig.path.root, resultConfig.path.server);
        }
        if (resultConfig.path.resources.indexOf('/') !== 0) {
            resultConfig.path.resources = path.join(resultConfig.path.root, resultConfig.path.resources);
        }
    }
    resultConfig.path.views = path.join(resultConfig.path.resources, 'views');
    return resultConfig;
};

class Context {
    container = {};
    config = null;

    constructor(cfg) {
        this.config = refactorConfig(cfg);
    }

    register(name, module) {
        this.container[name] = module;
    }

    module(name) {
        return this.container[name];
    }

    async bootstrap() {
        if (this.config.nacos) {
            this.config.nacos.logger = logger
            const configClient = new NacosConfigClient(this.config.nacos);
            const configContent = await configClient.getConfig(this.config.name + '.json', 'DEFAULT_GROUP')
            this.config = Object.assign(this.config, JSON.parse(configContent))
            configClient.subscribe({dataId: this.config.name + '.json', group: 'DEFAULT_GROUP'}, content => {
                this.config = Object.assign(this.config, JSON.parse(content))
            });

            const namingClient = new NacosNamingClient(this.config.nacos);
            await namingClient.ready();
            this.config.endpoints.forEach(endpoint=>
                namingClient.subscribe(endpoint.serviceName, hosts => {
                    logger.info("%s: hosts updating.", endpoint.serviceName)
                    //TODO Register more useful things
                    this.register('endpoint.' + endpoint.serviceName, hosts)
                }))
            ;
        }
    }
}

export default new Context(config);