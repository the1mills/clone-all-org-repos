'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const github_auth_1 = require("./github-auth");
const path = require("path");
const cp = require("child_process");
const logger_1 = require("./logger");
const ijson = require("siamese");
const async = require("async");
const user_said_yes_1 = require("./user-said-yes");
const set_data_1 = require("./set-data");
const rl_1 = require("./rl");
const cwd = process.cwd();
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
    getOrgsList(cb) {
        github_auth_1.default.orgs.getOrganizationMemberships({ state: 'active' }, (err, res) => {
            if (err) {
                return cb(err, null);
            }
            try {
                res = JSON.parse(res);
            }
            catch (err) {
            }
            assert(Array.isArray(res), ' Github API response was not any array.');
            if (res.length < 1) {
                return cb(new Error('You do not belong to any organizations on Github.'), null);
            }
            console.log('You have an active account (not pending) with the following organizations =>', '\n');
            cb(null, res.map((item, index) => {
                const login = item.organization && item.organization.login;
                console.log('[' + (index + 1) + '] =>', login);
                return String(login || 'unknown').toUpperCase();
            }));
        });
    },
    pickOrg(data, cb) {
        (function prompt() {
            rl_1.rl.question('Please enter the Github organization name you wish to clone repos from:', a => {
                rl_1.rl.close();
                if (data.indexOf(a.trim().toUpperCase()) < 0) {
                    logger_1.default.error(' => Error => User selected a bad organization name, please try again.');
                    return prompt();
                }
                cb(null, a);
            });
        })();
    },
    verifyCWD(data, cb) {
        rl_1.rl.question('Are you sure you want to clone the Github repos for Github organization => "' +
            data + '" to the cwd ("yes"/"no") => \n => cwd = "' + cwd + '"', a => {
            rl_1.rl.close();
            user_said_yes_1.default(a) ?
                cb(null, null) :
                cb(new Error(' => User does not wish to install repos in cwd, we are done here, ' +
                    'you must "cd" to the desired directory and re-issue the caGor command.'), null);
        });
    },
    chooseRepos(org, cb) {
        github_auth_1.default.repos.getForOrg({ org }, (err, res) => {
            if (err) {
                return cb(err, null);
            }
            ijson.parse(res).then((json) => {
                const cloneUrls = json.map(item => String(item.clone_url));
                async.mapSeries(cloneUrls, function (item, cb) {
                    rl_1.rl.question('=> Do you wish to clone and build the following git repo => ' + item, a => {
                        rl_1.rl.close();
                        cb(null, user_said_yes_1.default(a) ? item : null);
                    });
                }, (err, results) => {
                    if (err) {
                        return cb(err, null);
                    }
                    const filteredResults = results.filter(Boolean);
                    console.log(' => The following repos will be cloned to your local machine:\n', filteredResults.map((item, i) => i + '\n => ' + item));
                    async.mapLimit(filteredResults, 3, (item, cb) => {
                        const endian = path.basename(path.normalize(item).split('/').pop()).replace('.git', '');
                        const k = cp.spawn('bash');
                        const cmd = 'git clone ' + item + ' ' + endian + ' && cd ' + endian + ' && chmod -R 777 . && npm i --silent';
                        k.stdin.end(cmd);
                        k.stderr.pipe(process.stderr);
                        k.once('close', function (code) {
                            if (code > 0) {
                                logger_1.default.error(' => The following item may not have been cloned or built correctly =>', item);
                            }
                            cb();
                        });
                    }, cb);
                });
            });
        });
    }
};
