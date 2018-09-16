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
import {EVCb, UserOrOrg} from "./index";
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

  getOrgsList(username: string, cb: EVCb<any>) {

    // github.orgs.getOrganizationMemberships({state: 'active'}, (err: any, res: any) => {

    github.users.getOrgMemberships({state: 'active'}, (err: any, res: any) => {

      if (err) {
        return cb(err, null);
      }

      try {
        res = <Array<any>>JSON.parse(res);
        res = res.data || res;
        assert(Array.isArray(res), ' Github API response was not any array.');

      }
      catch (err) {
        return cb(err, null);
      }

      if (res.length < 1) {
        log.warn('You do not belong to any organizations on Github.');
      }

      cb(null, res.map((item: any, index: number) => {
        const login = item.organization && item.organization.login;
        return String(login || ' *** unknown *** ').toUpperCase();
      }));

    });
  },

  userOrOrg(username: string, orgs: Array<string>, cb: EVCb<UserOrOrg>) {

    log.info('Your username is:', username);

    if (orgs.length < 1) {
      log.warn('You do not appear to belong to any orgs, so we will show you repos under your user account only.');
      return process.nextTick(cb, null, 'username')
    }

    log.info('You belong to these orgs:');
    orgs.forEach(v => log.info(v));

    rl.question(promptStr('Do you wish to clone repos for your user account or for an organization for your user account belongs to? (type user or org)'), a => {

      cb(null, String(a || '').toLowerCase().startsWith('user') ? 'username' : 'org');

    });

  },

  pickOrg(data: Array<string>, cb: EVCb<any>) {

    (function prompt() {

      rl.question(promptStr('Please enter the Github organization name you wish to clone repos from:'), a => {

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

  findRepos(org: string, username: string, cb: EVCb<Array<string>>) {

    if (org && username) {
      return process.nextTick(cb, new Error('Both org and username were passed to find repos.'));
    }

    if (!org && !username) {
      return process.nextTick(cb, new Error('Neither org nor username was passed to find repos.'));
    }

    const method = org ?
      github.repos.getForOrg.bind(github.repos, {org}) :
      github.repos.getForUser.bind(github.repos, {username});

    method((err: any, res: any | Array<any>) => {

      if (err) {
        return cb(err, null);
      }

      try {
        res = JSON.parse(res);
        res = res.data || res;
        assert(Array.isArray(res), ' Github API response was not any array.');
      }
      catch (err) {
        return cb(err, null);
      }

      const sshUrls = (<Array<{ ssh_url: string }>>res).map(item => item.ssh_url);
      cb(null, sshUrls);

    });

  },

  cloneRepos(urls: Array<string>, cb: EVCb<any>) {

    async.mapSeries(urls, (item, cb) => {

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

          cb(code, item);
        });

      }, cb);

    });

  }

}

