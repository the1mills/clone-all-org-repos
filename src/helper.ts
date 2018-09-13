'use strict';

//core
import assert = require('assert');
import * as path from 'path';
import * as cp from 'child_process';
import * as fs from 'fs';

//npm
import * as ijson from "siamese";
import * as async from 'async';
import chalk from "chalk";


//project
import {promptStr, userSaidYes} from './utils';
import {rl} from "./rl";
import {EVCb} from "./index";
import log from "./logger";
import github from "./github-auth";


export default {

  cleanCache(cb: EVCb<any>) {

    rl.question(promptStr('Do you want to clear the NPM cache? '), a => {

      if (!userSaidYes(a)) {
        return cb(null, null);
      }

      cp.exec('npm cache clean', cb);

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
        login && console.log('=>', chalk.cyan.bold(login));
        return String(login || ' *** unknown *** ').toUpperCase();
      }));

    });
  },

  pickOrg(data: Array<string>, cb: EVCb<any>) {

    (function prompt() {

      rl.question(promptStr('Please enter the Github organization name you wish to clone repos from:'), a => {

        // rl.close();

        if (data.indexOf(a.trim().toUpperCase()) < 0) {
          log.error('Error => You selected a bad organization name, please try again.');
          return prompt();
        }

        cb(null, a);

      });

    })();

  },

  verifyCWD(data: string, cb: EVCb<any>) {

    log.info('Your current cwd is: ', process.cwd());

    rl.question(promptStr(`Are you sure you want to clone the Github repos for Github organization => "${chalk.bold(data)}" to the cwd ("yes"/"no")`), a => {

      // rl.close();

      userSaidYes(a) ? cb(null, null) : cb(
        new Error('User does not wish to install repos in cwd. You must "cd" to the desired directory and re-issue the caGor command.'),
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

        async.mapSeries(cloneUrls, (item, cb) => {

          rl.question(promptStr('Do you wish to clone and build the following git repo => ' + item), a => {
            cb(null, userSaidYes(a) ? item : null);
          });


        }, (err, results) => {

          if (err) {
            return cb(err, null);
          }

          const filteredResults = results.filter(Boolean);
          log.info(' => The following repos will be cloned to your local machine:');
          log.info(filteredResults);

          const strm = fs.createWriteStream(path.resolve(process.cwd() + '/cagor-install.log'));

          async.mapLimit(filteredResults, 1, (item, cb) => {

            log.info('Cloning:', item, '...');

            const endian = path.basename(path.normalize(<string>item).split('/').pop()).replace('.git', '');
            const k = cp.spawn('bash');

            const cmd = 'git clone ' + item + ' ' + endian + ' && cd ' + endian + ' && chmod -R 777 . && npm i --silent';

            k.stdin.end(cmd);
            k.stderr.pipe(strm, {end: false});

            k.once('close', code => {

              if (code > 0) {
                log.error('The following item may not have been cloned or built correctly =>', item);
                log.error('The following command failed:', cmd);
              }
              else {
                strm.write('\n\n\n ... moving to the next repo ... \n\n\n');
              }

              cb(code);
            });

          }, cb);

        });

      });

    });

  }

}

