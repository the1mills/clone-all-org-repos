

//NOTE:  http://mikedeboer.github.io/node-github/#api-repos-getForOrg


//core
const util = require('util');
const path = require('path');
const cp = require('child_process');

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

        console.log('waterfall results =>', result);

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
                ijson.parse(res).then(
                    function (json) {

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

                            console.log('unfiltered-results:', results);
                            const filteredResults = results.filter(item => !!item);
                            console.log('filtered-results:', filteredResults);

                            async.map(filteredResults, function (item, cb) {

                                const endian = path.basename(path.normalize(item).split('/').pop()).replace('.git', '');

                                cp.exec('git clone ' + item + ' ' + endian + ' && cd ' + endian + ' && chmod -R 777 . && npm install',
                                    function (err, stdout, stderr) {
                                        if (err || String(stdout).match(/error/i || String(stderr).match(/error/i))) {
                                            console.log(' => Error stack => ' + (err.stack || err));
                                            console.log(' => Stdout => ' + stdout);
                                            console.log(' => Stderr => ' + Stderr);
                                        }
                                        cb(null);
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
