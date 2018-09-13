'use strict';
const GitHubApi = require('github');
module.exports = new GitHubApi({
    debug: false,
    protocol: 'https',
    host: 'api.github.com',
    pathPrefix: '',
    timeout: 5000,
    headers: {
        'user-agent': 'My-Cool-GitHub-App'
    },
    followRedirects: false
});
