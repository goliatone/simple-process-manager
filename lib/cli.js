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

        const server = _isString(config.worker) ?
            require(config.worker) :
            config.worker;

        logger.info('child: process', process.pid);

        ProcessManager.worker.start({ shutdown: server.close }).then(function $ready() {
            server.start({
                logger: config.logger
            });
        });
    }
};

function _isString(o) {
    return typeof o === 'string';
}