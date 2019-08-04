'use strict';

const worker = require('./worker');
const leader = require('./leader');

module.exports = {
    worker,
    leader,
};