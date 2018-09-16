'use strict';

import chalk from "chalk";
const isDebug = process.env.cagor_is_debug === 'yes';

export const log = {
  info: console.log.bind(console, chalk.gray('cagor info:')),
  warning: console.error.bind(console, chalk.bold.yellow.bold('cagor warn:')),
  warn: console.error.bind(console, chalk.bold.magenta.bold('cagor warn:')),
  error: console.error.bind(console, chalk.redBright.bold('cagor error:')),
  debug: function (...args: any[]) {
    isDebug && console.log('cagor debug:', ...args);
  }
};

export default log;

