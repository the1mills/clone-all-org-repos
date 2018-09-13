#!/usr/bin/env node
process.on('exit', function (code) {
    console.log(' => caGor is exiting...with code => ' + code);
});
require('./lib/clone-all-repos');
