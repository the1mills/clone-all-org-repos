'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const cp = require("child_process");
const async = require("async");
const ijson = require("siamese");
const helper_1 = require("./helper");
const user_said_yes_1 = require("./user-said-yes");
const set_data_1 = require("./set-data");
const github_auth_1 = require("./github-auth");
process.stdin.resume();
process.stdin.setEncoding('utf8');
async.series({
    username: set_data_1.default('Please enter your Github username:'),
    password: set_data_1.default('Please enter your Github password:')
}, (err, results) => {
    if (err) {
        throw err;
    }
    onUserDataReceived(results);
});
function onUserDataReceived(data) {
    const username = data.username;
    const password = data.password;
    github_auth_1.default.authenticate({
        type: 'basic',
        username: username,
        password: password
    });
    async.waterfall([
        helper_1.default.cleanCache('Do you want to run "$ npm cache clean"? ("yes"/"no")'),
        helper_1.default.getOrgsList,
        helper_1.default.pickOrg,
        helper_1.default.verifyCWD
    ], (err, result) => {
        if (err) {
            throw err;
        }
        github_auth_1.default.repos.getForOrg({ org: result }, (err, res) => {
            if (err) {
                throw err;
            }
            ijson.parse(res).then(function (json) {
                const cloneUrls = json.map(item => String(item.clone_url));
                async.mapSeries(cloneUrls, function (item, cb) {
                    set_data_1.default('\n => Do you wish to clone and build the following git repo => ' + item, function (text, cb) {
                        if (user_said_yes_1.default(text)) {
                            cb(null, item);
                        }
                        else {
                            cb(null, null);
                        }
                    })(cb);
                }, function (err, results) {
                    const filteredResults = results.filter(Boolean);
                    console.log(' => The following repos will be cloned to your local machine:\n', filteredResults.map((item, i) => i + '\n => ' + item));
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
