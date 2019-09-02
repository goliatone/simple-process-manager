'use strict';

const cluster = require('cluster');
const ProcessManager = require('.');
const Metadata = require('.').metadata;

module.exports.run = function(config) {
    //TODO: provide alternative logger
    const logger = config.logger;

    if (cluster.isMaster) {

        logger.info('-------- LEADER PROCESS -------');
        logger.info(`leader: ${process.pid}`);

        extend.only(['name', 'instances', 'worker', 'pids']);
        const info = extend({}, config);

        const metadata = new Metadata({
            logger,
        });

        ProcessManager.leader.start({
            info,
            metadata,
            instances: config.instances
        });

    } else {

        const worker = _isString(config.worker) ?
            require(config.worker) :
            config.worker;

        logger.info('child: process', process.pid);

        ProcessManager.worker.start({
            shutdown: worker.close.bind(worker)
        }).then(function $ready() {
            /**
             * TODO: We should be able to pull config from options
             */
            worker.start({
                logger: config.logger
            });
        });
    }
};



function _isString(o) {
    return typeof o === 'string';
}