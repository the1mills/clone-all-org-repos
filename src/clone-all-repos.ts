'use strict';

//NOTE:  http://mikedeboer.github.io/node-github/#api-repos-getForOrg

//core
import util = require('util');
import path = require('path');
import cp = require('child_process');
import fs = require('fs');

//npm
import async = require('async');
import * as ijson from 'siamese';

//project
import helper from './helper';
import github from './github-auth';
import readline = require('readline');
import {EVCb} from "./index";
import log from "./logger";
import {rl} from "./rl";


async.autoInject({

    username(cb: EVCb<string>) {
      rl.question('Please enter your Github username:', a => {
        rl.close();
        cb(null, a);
      });
    },


    password(username: string, cb: EVCb<string>) {
      rl.question('Please enter your Github password:', a => {
        rl.close();
        cb(null, a);
      });
    },

    auth(username: string, password: string, cb: EVCb<any>) {
      github.authenticate({
        type: 'basic',
        username: username,
        password: password
      });
      process.nextTick(cb);
    },

    cleanCache(auth: any, cb: EVCb<any>) {
      // helper.cleanCache('Do you want to run "$ npm cache clean"? ("yes"/"no")',cb);
      process.nextTick(cb);
    },


    getOrgsList(auth: any, cb: EVCb<any>) {
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




