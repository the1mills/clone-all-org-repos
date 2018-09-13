'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const GitHubApi = require('github');
exports.default = new GitHubApi({
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
