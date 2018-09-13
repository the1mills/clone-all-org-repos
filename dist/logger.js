'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const isDebug = process.env.cagor_is_debug === 'yes';
exports.log = {
    info: console.log.bind(console, chalk_1.default.gray('cagor info:')),
    warning: console.error.bind(console, chalk_1.default.bold.yellow.bold('cagor warn:')),
    warn: console.error.bind(console, chalk_1.default.bold.magenta.bold('cagor warn:')),
    error: console.error.bind(console, chalk_1.default.redBright.bold('cagor error:')),
    debug: function (...args) {
        isDebug && console.log('cagor debug:', ...arguments);
    }
};
exports.default = exports.log;
