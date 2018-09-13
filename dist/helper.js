'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const assert = require("assert");
const ijson = require("siamese");
const user_said_yes_1 = require("./user-said-yes");
const set_data_1 = require("./set-data");
const cwd = process.cwd();
const github_auth_1 = require("./github-auth");
exports.default = {
    cleanCache(msg) {
        return set_data_1.default(msg, function (text, cb) {
            if (user_said_yes_1.default(text)) {
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
                    cb(null, null);
                });
            }
        });
    },
    getOrgsList(data, cb) {
        github_auth_1.default.orgs.getOrganizationMemberships({ state: 'active' }, function (err, res) {
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
    pickOrg(data, cb) {
        const msg = 'Please enter the Github organization name you wish to clone repos from:';
        set_data_1.default(msg, function response(text, cb) {
            console.log('text => ', text);
            if (false && data.indexOf(String(text).trim().toUpperCase()) < 0) {
                console.log(' => Error => User selected a bad organization name, please try again.');
                set_data_1.default.apply(null, [msg, response])(cb);
            }
            else {
                cb(null, text);
            }
        })(cb);
    },
    verifyCWD(data, cb) {
        set_data_1.default('Are you sure you want to clone the Github repos for Github organization => "' +
            data + '" to the cwd ("yes"/"no") => \n => cwd = "' + cwd + '"', function (text, cb) {
            if (user_said_yes_1.default(text)) {
                process.nextTick(function () {
                    cb(null, data);
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
};
