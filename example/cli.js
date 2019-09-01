'use strict';

const cluster = require('cluster');
const ProcessManager = require('..');

/**
 * ! A) Improve: can we use cluster IPC send/message
 * ! B) use busybody to handle socket in use
 */
if (cluster.isMaster) {
    console.log('-------- LEADER PROCESS -------');
    console.log(`leader: ${process.pid}`);
    ProcessManager.leader.start({
        instances: require('os').cpus().length
    });
} else {
    const server = require('./server');
    console.log('child: process', process.pid);

    ProcessManager.worker.start({ shutdown: server.close }).then(function $ready() {
        server.start({
            logger: console
        });
    });
}

/*
ProcessManager.wheRunningAsLeader(leader => {

    leader.logger.info('-------- LEADER PROCESS -------');
    leader.logger.info(`leader: ${process.pid}`);

    leader.start({
        instances: require('os').cpus().length
    });
});

ProcessManager.whenRunningAsWorker(worker => {

    const server = require('./server');

    worker.logger.info('child: process', process.pid);

    worker.start({
        shutdown: server.close
    }).then(_ => {
        server.start();
    });
});
*/