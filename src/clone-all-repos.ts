'use strict';

//NOTE:  http://mikedeboer.github.io/node-github/#api-repos-getForOrg

//npm
import async = require('async');

//project
import helper from './helper';
import github from './github-auth';
import {EVCb} from "./index";
import log from "./logger";
import {rl} from "./rl";
import chalk from "chalk";
import {promptStr} from "./utils";


async.autoInject({

    username(cb: EVCb<string>) {
      rl.question(promptStr('Please enter your Github username: '), a => {
        cb(null, a);
      });
    },

    password(username: string, cb: EVCb<string>) {
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


    getOrgsList(auth: any, cb: EVCb<any>) {
      log.info('Retrieving the list of organizations you belong to...');
      helper.getOrgsList(cb);
    },


    chooseOrg(cleanCache: any, getOrgsList: Array<string>, cb: EVCb<string>) {
      helper.pickOrg(getOrgsList, cb);
    },


    verifyCWD(chooseOrg: string, cb: EVCb<any>) {
      helper.verifyCWD(chooseOrg, cb);
    },


    chooseRepos(cleanCache: any, verifyCWD: any, chooseOrg: string, cb: EVCb<Array<string>>) {
      helper.chooseRepos(chooseOrg, cb);
    }

  },

  (err, results: { chooseRepos: Array<any> }) => {

    if (err) {
      throw err;
    }

    const count = results.chooseRepos.length;
    console.log((results.chooseRepos.length > 0 ? count + ' Github repos cloned.' : ' 0 Github repos cloned.'));

    log.info('all done!');
    process.exit(0);

  });




