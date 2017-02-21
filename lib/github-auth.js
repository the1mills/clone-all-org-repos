'use striiiict';

const GitHubApi = require('github');

module.exports = new GitHubApi({
    // optional
    debug: false,
    protocol: 'https',
    host: 'api.github.com', // should be api.github.com for GitHub
    pathPrefix: '', // for some GHEs; none for GitHub
    timeout: 5000,
    headers: {
        'user-agent': 'My-Cool-GitHub-App' // GitHub is happy with a unique user agent
    },
    followRedirects: false
});