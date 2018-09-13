#!/usr/bin/env node
process.on('exit', function (code) {
    console.log(' => caGor is exiting...with code => ' + code);
});
require('./clone-all-repos');
