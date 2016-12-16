#!/usr/bin/env node

process.on('uncaughtException', function (e) {
    console.log(e.stack || e);
});

process.on('unhandledRejected', function (e) {
    console.log(e.stack || e);
});

process.on('exit', function (code) {
    console.log(' => caGor is exiting...with code => ' + code);
    console.log('\n\n');
});

require('./lib/clone-all-repos');