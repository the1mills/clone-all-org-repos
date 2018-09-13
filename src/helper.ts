'use strict';

//core
const cp = require('child_process');
const assert = require('assert');

//npm
const ijson = require('siamese');

//project
const userSaidYes = require('./user-said-yes');
const setData = require('./set-data');
const cwd = process.cwd();

////////////////////////////////////////////////////////

module.exports = function init(github) {

  return Object.freeze({

    cleanCache: function cleanCache(msg) {
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

    getOrgsList: function (data, cb) {
      github.orgs.getOrganizationMemberships({state: 'active'}, function (err, res) {
        if (err) {
          cb(err);
        }
        else {
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

        }
      });
    },

    pickOrg: function (data, cb) {
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

    verifyCWD: function (data, cb) {
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

  });

};