'use strict';

const test = require('tape');
const sinon = require('sinon');

const Worker = require('../lib').worker;

test('Module should be bootstraped OK', t => {
    t.ok(Worker);
    t.end();
});