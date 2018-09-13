#!/usr/bin/env node

import log from './logger';

process.on('exit',  (code) => {
    console.log();
    log.warn('cagor is exiting...with code => ' + code);
});

require('./clone-all-repos');