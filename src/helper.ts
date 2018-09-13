'use strict';

//core
import assert = require('assert');
import github from "./github-auth";
import * as path from 'path';
import * as cp from 'child_process';
import log from "./logger";

//npm
import * as ijson from "siamese";
import * as async from 'async';

//project
import userSaidYes from './user-said-yes';
import setData from './set-data';
import {rl} from "./rl";
import {EVCb} from "./index";

const cwd = process.cwd();


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
    });

  },

  getOrgsList(cb: EVCb<any>) {

    github.orgs.getOrganizationMemberships({state: 'active'}, (err: any, res: any) => {

      if (err) {
        return cb(err, null);
      }

      try {
        res = <Array<any>>JSON.parse(res);
      }
      catch (err) {
        // ignore
      }

      assert(Array.isArray(res), ' Github API response was not any array.');

      if (res.length < 1) {
        return cb(new Error('You do not belong to any organizations on Github.'), null);
      }

      console.log('You have an active account (not pending) with the following organizations =>', '\n');

      cb(null, res.map((item: any, index: number) => {
        const login = item.organization && item.organization.login;
        console.log('[' + (index + 1) + '] =>', login);
        return String(login || 'unknown').toUpperCase();
      }));

    });
  },

  pickOrg(data: Array<string>, cb: EVCb<any>) {

    (function prompt() {

      rl.question('Please enter the Github organization name you wish to clone repos from:', a => {

        rl.close();

        if (data.indexOf(a.trim().toUpperCase()) < 0) {
          log.error(' => Error => User selected a bad organization name, please try again.');
          return prompt();
        }

        cb(null, a);

      });

    })();

  },

  verifyCWD(data: string, cb: EVCb<any>) {

    rl.question('Are you sure you want to clone the Github repos for Github organization => "' +
      data + '" to the cwd ("yes"/"no") => \n => cwd = "' + cwd + '"', a => {

      rl.close();

      userSaidYes(a) ?

        cb(null, null) :

        cb(
          new Error(' => User does not wish to install repos in cwd, we are done here, ' +
            'you must "cd" to the desired directory and re-issue the caGor command.'),
          null
        );

    });

  },


  chooseRepos(org: string, cb: EVCb<Array<string>>) {


    github.repos.getForOrg({org}, (err: any, res: string) => {

      if (err) {
        return cb(err, null);
      }

      ijson.parse(res).then((json: Array<{ clone_url: string }>) => {

        const cloneUrls = json.map(item => String(item.clone_url));

        async.mapSeries(cloneUrls, function (item, cb) {

          rl.question('=> Do you wish to clone and build the following git repo => ' + item, a => {
            rl.close();
            cb(null, userSaidYes(a) ? item : null);
          });


        }, (err, results) => {

          if (err) {
            return cb(err, null);
          }


          const filteredResults = results.filter(Boolean);

          console.log(' => The following repos will be cloned to your local machine:\n',
            filteredResults.map((item, i) => i + '\n => ' + item));

          async.mapLimit(filteredResults, 3, (item, cb) => {

            const endian = path.basename(path.normalize(<string>item).split('/').pop()).replace('.git', '');

            const k = cp.spawn('bash');

            const cmd = 'git clone ' + item + ' ' + endian + ' && cd ' + endian + ' && chmod -R 777 . && npm i --silent';

            k.stdin.end(cmd);
            k.stderr.pipe(process.stderr);

            k.once('close', function (code) {
              if (code > 0) {
                log.error(' => The following item may not have been cloned or built correctly =>', item);
              }
              cb();
            });

          }, cb);

        });

      });

    });

  }


}

