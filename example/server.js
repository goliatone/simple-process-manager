'use strict';

const http = require('http');
let logger = console;

const server = http.createServer(function $createServer(req, res) {
    let crash = randomInt(0, 10) > 11;

    if (crash) {
        throw new Error('something here');
    }

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Hello World! From ${process.pid} with love...\n`);
});

const _connections = { _i: 0 };

//https://github.com/thedillonb/http-shutdown/blob/master/index.js
server.on('connection', function $onConnection(socket) {
    const id = ++_connections._i;
    socket._connectionId = id;
    _connections[id] = socket;
    logger.info('child %s: add socket %s', process.pid, id);

    socket.on('close', function() {
        logger.info('child %s: remove socket %s', process.pid, id);
        delete _connections[id];
    });
});

module.exports = {
    start(config = {}) {
        if (config.logger) logger = config.logger;

        logger.info('############### CHILD PROCESS ###############');
        logger.info('child %s: start listen on 3999', process.pid);
        server.listen(3999);
    },
    close() {
        return new Promise(function $onCloseHandler(resolve) {
            logger.info('child %s: closing server...', process.pid);
            Object.keys(_connections).forEach(function $socRem(key) {
                logger.info('child %s: remove: %s', process.pid, key);
                const socket = _connections[key];
                if (socket && socket.destroy) socket.destroy();
            });

            server.close(resolve);
        });
    }
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}