'use strict';

//NOTE:  http://mikedeboer.github.io/node-github/#api-repos-getForOrg

//core
const util = require('util');
const path = require('path');
const cp = require('child_process');
const fs = require('fs');

//npm
const async = require('async');
const ijson = require('siamese');

//project
const helperModule = require('./helper');

var helper;
const userSaidYes = require('./user-said-yes');
const setData = require('./set-data');
const github = require('./github-auth');

process.stdin.resume();
process.stdin.setEncoding('utf8');

const folder = path.resolve(process.env.HOME + '/.cagor');
const log = path.resolve(folder + '/install.log');

try {
  fs.mkdir(folder)
}
catch(err){

}

const strm = fs.createWriteStream(log, {end:false});

async.series({

  username: setData('Please enter your Github username:'),
  password: setData('Please enter your Github password:')

}, function (err, results) {
  if (err) {
    console.log(err.stack || err);
    process.exit(1);
  }
  else {
    console.log('onUserDataReceived');
    onUserDataReceived(results);
  }
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

  helper = helperModule(github);

  async.waterfall([

    helper.cleanCache('Do you want to run "$ npm cache clean"? ("yes"/"no")'),
    helper.getOrgsList,
    helper.pickOrg,
    helper.verifyCWD

  ], function (err, result) {

    if (err) {
      console.log(err.stack || err);
      return process.exit(1);
    }

    github.repos.getForOrg({

      org: result

    }, function (err, res) {
      if (err) {
        console.error(err.stack || err);
        process.exit(1);
      }
      else {

        ijson.parse(res).then(function (json) {

            const cloneUrls = json.map(item => String(item.clone_url));

            async.mapSeries(cloneUrls, function (item, cb) {

              setData('\n => Do you wish to clone and build the following git repo => ' + item, function (text, cb) {
                if (userSaidYes(text)) {
                  cb(null, item);
                }
                else {
                  cb(null, null);
                }

              })(cb);

            }, function (err, results) {

              const filteredResults = results.filter(item => !!item);
              console.log(' => The following repos will be cloned to your local machine:\n',
                filteredResults.map((item, i) => i + '\n => ' + item));

              async.mapLimit(filteredResults, 3, function (item, cb) {

                const endian = path.basename(path.normalize(item).split('/').pop()).replace('.git', '');

                const k = cp.spawn('bash');

                k.stdout.setEncoding('utf8');
                k.stderr.setEncoding('utf8');

                const cmd = 'git clone ' + item + ' ' + endian + ' && cd ' + endian + ' && chmod -R 777 . && npm install';

                k.stdin.write('\n' + cmd + '\n');

                process.nextTick(function(){
                   k.stdin.end();
                });

                k.stderr.pipe(strm);

                k.once('close',function(code){
                  if(code > 0){
                    console.log(' => The following item may not have been cloned or built correctly =>','\n',
                    item);
                  }
                  cb();
                });

              }, function complete(err, results) {
                if (err) {
                  console.log(err.stack);
                  process.exit(1);
                }
                else {
                  const count = results.length;
                  console.log('\n\n => All done here => ' +
                    (results.length > 0 ? count + ' Github repos cloned.' : ' 0 Github repos cloned.'));
                  process.exit(0);
                }

              });

            });

          },
          function onRejected(e) {
            console.log(e.stack || e);
          })
      }

    });
  });

}

