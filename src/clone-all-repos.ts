'use strict';

//NOTE:  http://mikedeboer.github.io/node-github/#api-repos-getForOrg

//npm
import async = require('async');

//project
import helper from './helper';
import github from './github-auth';
import {EVCb, UserOrOrg} from "./index";
import log from "./logger";
import {rl} from "./rl";
import {promptStr} from "./utils";
import * as util from "util";
import chalk from 'chalk';

process.on('uncaughtException', e => {
  const v = e.message || e;
  log.error('uncaught exception:', chalk.magenta(typeof v === 'string' ? v : util.inspect(v)));
  log.error('full trace:', e);
});

process.on('unhandledRejection', (r, d) => {
  const v = r.message || r;
  log.error('unhandled rejection:', chalk.magenta(typeof v === 'string' ? v : util.inspect(v)));
  log.error('full trace:', r);
});

async.autoInject({

    username(cb: EVCb<string>) {
      rl.question(promptStr('Please enter your Github username: '), a => {
        cb(null, a);
      });
    },

    password(username: string, cb: EVCb<string>) {
      // process.nextTick(cb);
      rl.question(promptStr('Please enter your Github password: '), a => {
        cb(null, a);
      });
    },

    auth(username: string, password: string, cb: EVCb<any>) {
      log.info('Authenticating...');
      github.authenticate({
        type: 'basic',
        username: username,
        password: password
      });
      process.nextTick(cb);
    },

    cleanCache(auth: any, cb: EVCb<any>) {
      // helper.cleanCache('Do you want to run "$ npm cache clean"? ("yes"/"no")',cb);
      log.info('Cleaning cache...');
      process.nextTick(cb);
    },

    getOrgsList(auth: any, username: string, cb: EVCb<any>) {
      log.info('Retrieving the list of organizations you belong to...');
      helper.getOrgsList(username, cb);
    },

    chooseUserOrOrg(cleanCache: any, username: string, getOrgsList: Array<string>, cb: EVCb<UserOrOrg>) {
      log.info('Please choose username or org.');
      helper.userOrOrg(username, getOrgsList, cb);
    },

    chooseOrg(cleanCache: any, chooseUserOrOrg: UserOrOrg, getOrgsList: Array<string>, cb: EVCb<string>) {
      if(chooseUserOrOrg === 'username'){
        return process.nextTick(cb, null, []);
      }
      helper.pickOrg(getOrgsList, cb);
    },

    verifyCWD(chooseUserOrOrg: UserOrOrg, username: string, chooseOrg: string, cb: EVCb<any>) {
      const v = chooseUserOrOrg === 'username' ? username : chooseOrg;
      helper.verifyCWD(v, cb);
    },

    findRepos(chooseUserOrOrg: UserOrOrg, username: string, chooseOrg: string, cb: EVCb<Array<string>>) {

      if (chooseUserOrOrg === 'username') {
        chooseOrg = null;
      }
      else {
        username = null;
      }

      helper.findRepos(chooseOrg, username, cb);
    },

    cloneRepos(cleanCache: any, verifyCWD: any, findRepos: Array<string>, cb: EVCb<Array<string>>) {
      helper.cloneRepos(findRepos, cb);
    }

  },

  (err, results: { cloneRepos: Array<any> }) => {

    if (err) {
      throw err;
    }

    const count = results.cloneRepos.length;
    console.log((results.cloneRepos.length > 0 ? count + ' Github repos cloned.' : ' 0 Github repos cloned.'));

    log.info('all done!');
    process.exit(0);

  });




