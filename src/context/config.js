
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

import config from '../../config/config.json';
import * as fs from "fs";

log4js.configure(config.log4js, {cwd: config.log4js.cwd});

const refactorConfig = (cfg) => {
    let resultConfig = cfg;
    if (!cfg.path.root) {
        resultConfig.path.root = path.join(__dirname, '../../..');
    }

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

const load_keys = (dir, keystore) => {
    if(!keystore) {
        keystore = {}
    }
    fs.readdirSync(dir).forEach(function (file) {
        if(file.endsWith(".json")) {
            const entries = require(path.join(dir,  file.replace(/\.json$/, "")));
            entries.forEach(entry=>{
                const address = entry.address;
                delete entry.address;
                keystore[address] = entry;
            });
            return;
        }
        if(fs.lstatSync(path.join(dir,file)).isDirectory()) {
            load_keys(path.join(dir, file), keystore);
        }
    });
    return keystore;
}

class Context {

    constructor (cfg) {
        this.config = refactorConfig(cfg);
        cfg.path.root = cfg.path.root.replaceAll("${pwd}", __dirname + "/..")
        this.container = {};
    }

    register (name, module) {
        this.container[name] = module;
    }

    module (name) {
        return this.container[name];
    }
}

export default new Context(config);