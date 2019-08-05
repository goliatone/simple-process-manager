'use strict';

const test = require('tape');
const sinon = require('sinon');

const Leader = require('../lib').leader;

test('Leader should be bootstraped OK', t => {
    t.ok(Leader);
    t.end();
});

test('Leader exposes defaults', t => {
    t.ok(Leader.defaults);
    t.ok(typeof Leader.defaults.cluster === 'function');
    t.ok(Leader.defaults.cluster.__shim);
    t.end();
});

test('Leader should be a singleton', t => {
    let a = new Leader({
        autoinitialize: false
    });

    let b = new Leader({
        autoinitialize: false
    });

    t.equals(a, b, 'Instances should be the same');

    t.end();
});

test('Leader should be able to create regular instances', t => {
    let a = new Leader({
        singleton: false,
        autoinitialize: false
    });

    let b = new Leader({
        singleton: false,
        autoinitialize: false
    });

    t.notEqual(a, b, 'Instances should be different');

    t.end();
});

test('Leader.eachWorker should call given callback on each worker', t => {
    const cluster = {
        isMaster: true,
        workers: {
            1: { id: 1 },
            2: { id: 2 },
            3: { id: 3 }
        },
        on() {},
    };

    const leader = new Leader({
        cluster,
        singleton: false
    });

    leader.eachWorker(worker => {
        t.deepEqual(worker, cluster.workers[worker.id], 'Workers should be equal');
    });

    t.end();
});

test('Leader should track exited workers', t => {

    const cluster = {
        isMaster: true,
        workers: {
            1: { id: 1 },
            2: { id: 2 },
            3: { id: 3 }
        },
        on() {},
        fork() {
            return {
                id: 1,
                on(type, cb) {
                    if (type === 'exit') this.cb = cb;
                }
            }
        }
    };

    const leader = new Leader({
        cluster,
        singleton: false
    });

    const worker = leader.fork();
    worker.cb(0);

    t.ok(leader.exitedWorkers[worker.id], 'worker id should be stored in extied worker list');

    t.end();
});

test.only('Leader should enable finding a worker by PID', t => {
    const cluster = {
        isMaster: true,
        workers: {
            1: { id: 1, process: { pid: 3331 } },
            2: { id: 2, process: { pid: 3332 } },
            3: { id: 3, process: { pid: 3333 } }
        },
        on() {},
    };

    const leader = new Leader({
        cluster,
        singleton: false
    });

    const worker = leader.findWorkerByPID(3333);

    t.deepEquals(leader.cluster, cluster);
    t.deepEquals(worker, cluster.workers[3]);

    t.end();
});