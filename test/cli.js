'use strict';

const test = require('tape');
const sinon = require('sinon');

const Cli = require('../lib').cli;

test('Module should be bootstraped OK', t => {
    t.ok(Cli);
    t.end();
});