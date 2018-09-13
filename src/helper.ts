'use strict';

//core
import cp = require('child_process');
import assert = require('assert');

//npm
import ijson = require('siamese');

//project
import userSaidYes from './user-said-yes';
import setData from './set-data';

const cwd = process.cwd();

////////////////////////////////////////////////////////

import github from './github-auth';
import {EVCb} from "./index";


export default {

  cleanCache(msg: string) {
    return setData(msg, function (text, cb) {
      if (userSaidYes(text)) {
        console.log(' => Cleaning npm cache...');
        const interval = setInterval(function () {
          process.stdout.write('.');
        }, 200);
        cp.exec('npm cache clean', function (err) {
          clearInterval(interval);
          cb(err, null);
        });
      }
      else {
        process.nextTick(function () {
          cb(null, null)
        });
      }
    })
  },

  getOrgsList(data: any, cb: EVCb<any>) {

    github.orgs.getOrganizationMemberships({state: 'active'}, function (err: any, res: string) {

      if (err) {
        return cb(err);
      }

      ijson.parse(res).then(function (val) {

        assert(Array.isArray(val), ' Github API response was not any array.');

        if (val.length) {
          console.log('You have an active account (not pending) with the following organizations =>', '\n');
        }
        else {
          return cb(new Error('You do not belong to any organizations on Github.'));
        }
        val = val.map((item, index) => {
          const login = item.organization.login;
          console.log('[' + (index + 1) + '] =>', login);
          return String(login).toUpperCase();
        });

        console.log('\n');
        cb(null, val);

      }, cb);


    });
  },

  pickOrg(data: any, cb: EVCb<any>) {
    const msg = 'Please enter the Github organization name you wish to clone repos from:';
    setData(msg, function response(text, cb) {
      console.log('text => ', text);
      if (false && data.indexOf(String(text).trim().toUpperCase()) < 0) {
        console.log(' => Error => User selected a bad organization name, please try again.');
        setData.apply(null, [msg, response])(cb);
      }
      else {
        cb(null, text);
      }
    })(cb);
  },

  verifyCWD(data: any, cb: EVCb<any>) {
    setData('Are you sure you want to clone the Github repos for Github organization => "' +
      data + '" to the cwd ("yes"/"no") => \n => cwd = "' + cwd + '"', function (text, cb) {
      if (userSaidYes(text)) {
        process.nextTick(function () {
          cb(null, data); // pass org name down
        });
      }
      else {
        process.nextTick(function () {
          cb(new Error(' => User does not wish to install repos in cwd, we are done here, ' +
            'you must "cd" to the desired directory and re-issue the caGor command.'));
        });
      }
    })(cb);
  }

}

