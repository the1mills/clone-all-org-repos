/**
 * Created by Olegzandr on 6/22/16.
 */


// >>>  http://mikedeboer.github.io/node-github/#api-repos-getForOrg

const cwd = process.cwd();

const async = require('async');
const ijson = require('siamese');

const path = require('path');
const cp = require('child_process');

var GitHubApi = require('github');

var github = new GitHubApi({
	// optional
	debug: true,
	protocol: 'https',
	host: 'api.github.com', // should be api.github.com for GitHub
	pathPrefix: '', // for some GHEs; none for GitHub
	timeout: 5000,
	headers: {
		'user-agent': 'My-Cool-GitHub-App' // GitHub is happy with a unique user agent
	},
	followRedirects: false
});

process.stdin.resume();
process.stdin.setEncoding('utf8');

const asyncNoop = function (text, cb) {
	process.nextTick(function () {
		cb(null, text);
	});
};

function setData(prompt, fn) {

	fn = fn || asyncNoop;

	return function captureData(cb) {

		console.log(prompt);

		process.stdin.on('data', function (text) {

			process.stdin.removeAllListeners();

			const userResponse = String(text).trim();
			fn(userResponse, function (err, res) {
				cb(err, res);
			});
		});
	}
}

async.series({
	username: setData('Please enter your Github username:'),
	password: setData('Please enter your Github password:'),
	cwd: setData('Are you sure you want to clone the Github repos to the cwd ("yes"/"no"): ' + cwd, function (text, cb) {
		if (String(text).toLowerCase() === 'yes') {
			process.nextTick(function () {
				cb(null, text);
			});
		}
		else {
			process.nextTick(function () {
				cb(new Error(' => User does not wish to install repos in cwd, we are done here, ' +
					'you must "cd" to the desired directory.'));
			});
		}
	}),
	orgName: setData('Please enter the Github organization name:'),
	cleanCache: setData('Do you want to run "$ npm cache clean"? ("yes"/"no")', function (text, cb) {
		if (text === 'yes') {
			console.log('Cleaning npm cache...');
			const interval = setInterval(function () {
				process.stdout.write('.');
			}, 200);
			cp.exec('npm cache clean', function (err) {
				clearInterval(interval);
				cb(err);
			});
		}
		else {
			process.nextTick(cb);
		}
	})
}, function (err, results) {
	if (err) {
		throw err;
	}
	else {
		onUserDataReceived(results);
	}
});

function onUserDataReceived(data) {

	const username = data.username;
	const password = data.password;

	// basic
	github.authenticate({
		type: "basic",
		username: username,
		password: password
	});

	github.repos.getForOrg({

		org: data.orgName

	}, function (err, res) {
		if (err) {
			console.error(err.stack);
		}
		else {
			ijson.parse(res).then(

				function (json) {

					const cloneUrls = json.map(item => String(item.clone_url));

					async.mapSeries(cloneUrls, function (item, cb) {

						setData('\n => Do you wish to clone and build the following git repo => ' + item, function (text, cb) {
							if (String(text).toLowerCase() === 'yes') {
								cb(null, item);
							}
							else {
								cb(null, null);
							}

						})(cb);

					}, function (err, results) {

						async.each(results.filter(item => !!item), function (item, cb) {

							const endian = path.basename(path.normalize(item).split('/').pop()).replace('.git', '');

							cp.exec('git clone ' + item + ' ' + endian + ' && cd ' + endian + ' && chmod -R 777 . && npm install', function (err) {
								err && console.log(err.stack);
								cb(null);
							});

						}, function complete(err, results) {
							if (err) {
								throw err;
							}
							else {
								console.log(' => All done here => ' + results);
							}

						});

					});

				}
			)
		}

	});

}

