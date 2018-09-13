'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const async = require("async");
const helper_1 = require("./helper");
const github_auth_1 = require("./github-auth");
const logger_1 = require("./logger");
const rl_1 = require("./rl");
async.autoInject({
    username(cb) {
        rl_1.rl.question('Please enter your Github username:', a => {
            rl_1.rl.close();
            cb(null, a);
        });
    },
    password(username, cb) {
        rl_1.rl.question('Please enter your Github password:', a => {
            rl_1.rl.close();
            cb(null, a);
        });
    },
    auth(username, password, cb) {
        github_auth_1.default.authenticate({
            type: 'basic',
            username: username,
            password: password
        });
        process.nextTick(cb);
    },
    cleanCache(auth, cb) {
        process.nextTick(cb);
    },
    getOrgsList(auth, cb) {
        helper_1.default.getOrgsList(cb);
    },
    chooseOrg(cleanCache, getOrgsList, cb) {
        helper_1.default.pickOrg(getOrgsList, cb);
    },
    verifyCWD(chooseOrg, cb) {
        helper_1.default.verifyCWD(chooseOrg, cb);
    },
    chooseRepos(cleanCache, verifyCWD, chooseOrg, cb) {
        helper_1.default.chooseRepos(chooseOrg, cb);
    }
}, (err, results) => {
    if (err) {
        throw err;
    }
    const count = results.chooseRepos.length;
    console.log((results.chooseRepos.length > 0 ? count + ' Github repos cloned.' : ' 0 Github repos cloned.'));
    logger_1.default.info('all done!');
    process.exit(0);
});
