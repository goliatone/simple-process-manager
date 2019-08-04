'use strict';

const extend = require('gextend');
const cluster = require('cluster');

const defaults = {
    logger: console,
    transport: {},
    autoinitilize: true,
    singleton: true
};

class ClusterWorker {
    constructor(config = {}) {
        config = extend({}, this.constructor.defaults, config);

        /**
         * Use a singleton...
         */
        if (config.singleton && ClusterWorker.instance) {
            return ClusterWorker.instance;
        }

        ClusterWorker.instance = this;

        if (config.autoinitilize) {
            this.init(config);
        }
    }

    init(config = {}) {
        if (this.initialized) return;
        this.initialized = true;

        extend(this, config);

        if (cluster.isMaster) {
            throw new Error('ClusterWorker must be initialized from a child process');
        }

        if (typeof config.shutdown !== 'function') {
            throw new Error('ClusterWorker needs a "config.shutdown" function');
        }

        //TODO: Refactor this :)
        process.on('message', event => {
            console.log('<<< child: message', event);

            if (event.signal === 'SIGINT') {
                process.stdout.write('this is a sigint outing \n');
                config.shutdown().then(_ => {
                    this.logger.info('child msg: exit do to master SIGNIT');
                    process.send({ id: event.id, pid: process.pid, type: 'disconnected' });
                    process.disconnect();
                    process.exit(0);
                }).catch(error => {
                    console.log('error', error);
                    process.exit(1);
                });
            }
        });

        process.on('SIGINT', _ => {
            config.shutdown().then(_ => {
                this.logger.info('child msg: exit do to master SIGNIT');
                process.disconnect();
                process.exit(0);
            }).catch(error => {
                console.log('error', error);
                process.exit(1);
            });
        });

        this.transport = {
            destroy() {
                // if(this.socket) {
                //     this.socket.destroy();
                //     this.socket = null;
                // }
            },
            connect(config) {
                // return new Promise((resolve, reject) => {
                //     this.socket = new.connect(config.path, _ => {
                //             socket.write(`pid:${process.pid}`);
                //             resolve();
                //         }).setKeepAlive(true)
                //         .on('data', msg => {
                //             msg = msg.toString();
                //             if (msg === 'SIGINT') {
                //                 config.shutdown().then(_ => {
                //                     socket.end();
                //                     process.exit(0);
                //                 });
                //             }
                //         }).on('error', reject);
                // });
            }
        }
    }

    async connect(config = {}) {
        return this.transport.connect(config);
    }

    destroy() {
        this.transport.destroy();
    }

    static async start(config) {
        const childProcess = new ClusterWorker(config);
        await childProcess.connect(config.transport);
        return childProcess;
    }
}

ClusterWorker.defaults = defaults;

module.exports = ClusterWorker;