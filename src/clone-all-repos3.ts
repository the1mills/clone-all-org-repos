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
import userSaidYes from './user-said-yes';
import setData from './set-data';
import github from './github-auth';

process.stdin.resume();
process.stdin.setEncoding('utf8');


async.series({

    username: setData('Please enter your Github username:'),
    password: setData('Please enter your Github password:')

  },

  (err, results) => {

    if (err) {
      throw err;
    }

    onUserDataReceived(results);

  });

function onUserDataReceived(data) {

  const username = data.username;
  const password = data.password;

  // basic
  github.authenticate({
    type: 'basic',
    username: username,
    password: password
  });

  async.waterfall([

    helper.cleanCache('Do you want to run "$ npm cache clean"? ("yes"/"no")'),
    helper.getOrgsList,
    helper.pickOrg,
    helper.verifyCWD

  ], (err, result) => {

    if (err) {
      throw err;
    }

    github.repos.getForOrg({org: result}, (err: any, res: string) => {

      if (err) {
        throw err;
      }

      ijson.parse(res).then(function (json: Array<{clone_url: string}>) {

        const cloneUrls = json.map(item => String(item.clone_url));

        async.mapSeries(cloneUrls, function (item, cb) {

          setData(' => Do you wish to clone and build the following git repo => ' + item, function (text, cb) {
            cb(null, userSaidYes(text) ? item: null);
          })(cb);

        }, function (err, results) {

          const filteredResults = results.filter(Boolean);

          console.log(' => The following repos will be cloned to your local machine:\n',
            filteredResults.map((item, i) => i + '\n => ' + item));

          async.mapLimit(filteredResults, 3, function (item, cb) {

            const endian = path.basename(path.normalize(item).split('/').pop()).replace('.git', '');

            const k = cp.spawn('bash');

            k.stdout.setEncoding('utf8');
            k.stderr.setEncoding('utf8');

            const cmd = 'git clone ' + item + ' ' + endian + ' && cd ' + endian + ' && chmod -R 777 . && npm i --silent';

            k.stdin.end(cmd);
            k.stderr.pipe(process.stderr);

            k.once('close', function (code) {
              if (code > 0) {
                console.error(' => The following item may not have been cloned or built correctly =>', '\n', item);
              }
              cb();
            });

          }, function complete(err, results) {

            if (err) {
              throw err;
            }

            const count = results.length;
            console.log('\n\n => All done here => ' +
              (results.length > 0 ? count + ' Github repos cloned.' : ' 0 Github repos cloned.'));
            process.exit(0);


          });

        });

      });

    });
  });

}

