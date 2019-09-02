'use strict';

const cluster = require('cluster');
const ProcessManager = require('..');
const Metadata = require('..').metadata;
const { resolve } = require('path');

/**
 * ! A) Improve: can we use cluster IPC send/message
 * ! B) use busybody to handle socket in use
 */
if (cluster.isMaster) {
    console.log('############### LEADER PROCESS ###############');
    console.log(`leader: ${process.pid}`);

    const metadata = new Metadata({
        logger: console,
    });

    const info = {
        name: 'example',
        worker: resolve('./server'),
        instances: require('os').cpus().length,
        description: 'Example showing how to run CLI process manager'
    };

    ProcessManager.leader.start({
        info,
        metadata,
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