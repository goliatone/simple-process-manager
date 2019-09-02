'use strict';

const { join } = require('path');
const fs = require('fs-extra');
const extend = require('gextend');
const untildify = require('untildify');

const defaults = {
    logger: extend.shim(console),
    filepath: '~/.core.io/process-manager',
    filename: 'metadata.json',
    meta: {
        workers: {}
    }
};

class Metadata {
    constructor(config = {}) {
        config = extend({}, this.constructor.defaults, config);
        this.init(config);
    }

    init(config = {}) {
        if (this.initialized) return;
        this.initialized = true;

        extend(this, config);
        extend.unshim(this);

        fs.ensureFileSync(this.metafile);
        let meta = fs.readFileSync(this.metafile);
        if (!meta || meta.toString() === 0) {
            this.meta = {
                workers: {}
            };
        }
    }

    async load() {
        try {
            let meta = await fs.readFile(this.metafile);

            if (meta && meta.length > 0) {
                this.meta = JSON.parse(meta.toString());
            }

        } catch (error) {
            this.logger.error(error);
        }

        return this;
    }

    async save() {
        try {
            await fs.writeJson(this.metafile, this.meta);
        } catch (error) {
            this.logger.error(error);
        }

        return this;
    }

    add(info) {
        //TODO: Make sure we don't have 
        this.meta.workers[info.name] = info;
        return this.save();
    }

    get(worker) {
        return this.meta.workers[worker];
    }

    remove(worker) {
        delete this.meta.workers[worker];
        return this.save();
    }

    forEach(callback) {
        Object.keys(this.meta.workers).forEach(worker => {
            callback(this.meta.workers[worker]);
        });

        return this;
    }

    get metafile() {
        return untildify(join(this.filepath, this.filename));
    }
}

Metadata.defaults = defaults;

module.exports = Metadata;