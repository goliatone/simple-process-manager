'use strict';

const extend = require('gextend');
const cluster = require('cluster');

const defaults = {
    setTimeout,
    timeout: 10 * 1000,
    logger: console,
    transport: {},
    autoinitilize: true,
    singleton: true
};

class ClusterLeader {
    constructor(config = {}) {

        config = extend({}, this.constructor.defaults, config);

        /**
         * Use a singleton...
         */
        if (config.singleton && ClusterLeader.instance) {
            return ClusterLeader.instance;
        }

        ClusterLeader.instance = this;

        if (config.autoinitilize) {
            this.init(config);
        }
    }

    init(config = {}) {
        if (this.initialized) return;
        this.initialized = true;

        extend(this, config);

        if (!cluster.isMaster) {
            throw new Error('ClusterLeader must be initialized from main process');
        }

        //TODO: Use Signals

        process.on('SIGINT', _ => {
            this.sigint(this.timeout);
        });

        process.on('SIGTERM', _ => {
            this.sigterm();
        });

        cluster.on('exit', (worker, code, signal) => {
            if (worker.exitedAfterDisconnect === true) {
                console.log('Oh, it was just voluntary – no need to worry');
            } else if (!this.waitingExit || !this.destroyed) {
                console.log('Ah! we should bring it back to life!');
                this.fork();
            } else {
                console.log('we should be gone', code, signal)
            }
        });

        /**
         * 
         */
        this.transport = {
            init(config) {
                // server = net.createServer(c => {
                //     let pid;
                //     c.on('data', msg => {
                //         msg = msg.toString();
                //         if (msg.includes('error:')) {
                //             let chunk = msg.split(' ');
                //             pid = chunk[0].split(':')[1];
                //             let error = chunk[1].split(':')[1];
                //             parent.handleError(pid, error);
                //         } else if (msg.startsWith('pid:')) {
                //             //register a socket to this worker pid
                //             pid = msgStr.split(':')[1];
                //             workerSockets[pid] = c;
                //         }
                //     });
                //     c.on('end', _ => {
                //         if (pid) delete workerSockets[pid];
                //     });
                // });
            },
            killWorker(worker, force = false) {
                //If we are using sockets
                // if (workerSockets[worker.process.pid]) {
                //     workerSockets[worker.process.pid].end();
                // }
            },
            notifyTerm(worker) {
                // if (workerSockets[worker.process.pid]) {
                //     workerSockets[worker.process.pid].write('SIGINT');
                // }
                if (worker.isConnected()) {
                    console.log('---> %s message: SIGINT', worker.process.pid);
                    worker.send({ signal: 'SIGINT', id: worker.id });
                } else {
                    console.log('worker %s disconnected', worker.process.pid);
                }

            },
            destroy() {
                // return new Promise((resolve) => {
                //     server.close(() => {
                //         server = null;
                //         resolve();
                //     });
                // });
                return Promise.resolve();
            }
        };
    }

    async connect(config = {}) {
        return await this.transport.init(config);
    }

    fork() {
        //this.transport.registerWorker(worker)

        let worker = cluster.fork();

        worker.on('message', function(message) {
            console.log(`leader: message '${JSON.stringify(message)}' from worker ${worker.process.pid}`);
            if (message.type === 'disconnected') worker.disconnect();
        });

        //Collect extied workers
        worker.on('exit', (code, signal) => {
            if (signal) {
                console.log(`worker was killed by signal: ${signal}`);
            } else if (code !== 0) {
                console.log(`worker exited with error code: ${code}`);
            } else {
                console.log('worker exit with success!');
                //this.exitedWorker(worker);
            }
        });

        return worker;
    }

    /**
     * Kill a process by id.
     * @param {Integer} pid Process id 
     */
    kill(pid) {
        const worker = this.findWorkerByPID(pid);

        if (!worker) {
            throw new Error(`No worker found with pid: ${pid}`);
        }

        this.killWorker(worker);

        return Promise.resolve();
    }

    /**
     * Terminate a worker by PID. 
     * This will try to gracefully shutdown the 
     * worker.
     * 
     * @param {Integer} pid PID
     */
    term(pid) {
        const worker = this.findWorkerByPID(pid);

        if (!worker) {
            throw new Error(`No worker found with pid: ${pid}`);
        }

        return this.termWorker(this.timeout, worker);
    }

    /**
     * Kill worker
     * @param {cluster.Worker} worker 
     * @return {ClusterLeader}
     */
    killWorker(worker, force = false, signal = 'SIGTERM') {
        this.logger.info(`kill worker ${worker.process.pid}, force ${force} signal ${signal}`);
        //If our transport needs to release the worker
        this.transport.killWorker(worker, force);

        /**
         * worker.kill will disconnect the `worker.process`
         * and once disconnected it will be killed with `signal`.
         */
        if (force) worker.process.kill();
        else worker.kill(signal);

        return this;
    }

    /**
     * Terminate workers gracefully and kill after timeout.
     * 
     * @param {cluster.Worker} worker Worker to be terminated
     * @param {int} timeout Time in milliseconds before killing child process
     * @return {Promise} Resolves when the child process has been terminated 
     * or killed.
     */
    termWorker(worker, timeout = this.timeout) {
        return new Promise((resolve, reject) => {

            const tid = this.setTimeout(_ => {
                this.logger.warn('leader: SIGTERM timed out');
                this.killWorker(worker);
                resolve({ type: 'timeout' });
            }, timeout);

            /**
             * In a worker this closes all servers,
             * will wait for the `close` event on those
             * servers and then disconnect the IPC channel.
             * This will cause the worker to call `disconnect`
             * on itself.
             * After this point we are not able to talk to the
             * worker process anymore...
             */
            worker.on('disconnect', _ => {
                this.logger.info('leader: child disconnected');
                clearTimeout(tid);
                //Clean up our worker connections etc
                this.transport.killWorker(worker);
                resolve({ type: 'disconnect', id: worker.id });
            });

            this.transport.notifyTerm(worker);
        });
    }

    /**
     * `SIGINT` listener
     * Notifies all workers that the 
     * leader process has received a `SIGINT` and allows
     * them to gracefully shutdown.
     * If workers have not shutdown after `timeout` then
     * they will be forcefully killed.
     * 
     * @param {Int} timeout 
     */
    sigint(timeout) {
        this.logger.info('leader: sigint');

        const shutdowns = this.eachWorker(worker => {
            return this.termWorker(worker, timeout);
        });

        this.waitingExit = true;

        Promise.all(shutdowns).then(res => {
            this.logger.info('all shut down: %j', res);
            this.exit();
        }).catch(error => {
            this.logger.error(error);
            throw error;
        });
    }

    sigterm() {
        this.logger.warn('leader: sigterm');

        this.waitingExit = true;

        this.eachWorker(worker => {
            return this.killWorker(worker);
        });

        this.exit();
    }

    destroy() {
        this.destroyed = true;

        this.logger.info('leader: destroy');

        // this.signals.destroy();
        process.removeAllListeners('SIGINT');
        process.removeAllListeners('SIGTERM');

        let out = this.transport.destroy();

        //Should we give a chance to cleanup outside?

        return Promise.resolve(out);
    }

    //TODO: We should call destroy, wait for workers to exit
    //and then exit ourselves 
    async exit() {

        this.logger.info('leader: exit');

        await this.destroy();

        this.logger.info('leader: now do exit');
        process.exit(0);

    }

    /**
     * Helper method to walk each worker and pass it
     * to `callback`.
     * 
     * @param {Function} callback Function to be called on each
     * worker. **Should return a promise**
     * 
     * @returns {Array} An array of promises that resolve from
     * the `callback`.
     */
    eachWorker(callback) {
        return Object.keys(cluster.workers)
            .map(id => callback(cluster.workers[id]));
    }

    /**
     * Get a worker by its PID
     * 
     * @param {Integer} pid PID
     */
    findWorkerByPID(pid) {
        const id = Object.keys(cluster.workers).find(k => {
            return cluster.workers[k].process.pid === parseInt(pid, 10);
        });
        return cluster.workers[id];
    }

    static async start(config, transport = {}) {
        const leader = new ClusterLeader(config);

        await leader.connect(transport);

        if (config.instances) {
            let total = parseInt(config.instances);
            for (let i = 0; i < total; i++) {
                leader.fork();
            }
        }

        return leader;
    }
}

ClusterLeader.defaults = defaults;

module.exports = ClusterLeader;