'use strict';

const cluster = require('cluster');
const ProcessManager = require('.');

module.exports.run = function(config) {
    const logger = config.logger;

    if (cluster.isMaster) {

        logger.info('-------- LEADER PROCESS -------');
        logger.info(`leader: ${process.pid}`);

        ProcessManager.leader.start({
            instances: config.instances
        });

    } else {

        const worker = _isString(config.worker) ?
            require(config.worker) :
            config.worker;

        logger.info('child: process', process.pid);

        ProcessManager.worker.start({ shutdown: worker.close }).then(function $ready() {
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