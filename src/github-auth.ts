'use strict';

// const GitHubApi = require('github');

import log from "./logger";

const Octokit = require('@octokit/rest');

export default new Octokit({
  // optional
  debug: false,
  // protocol: 'https',
  // host: 'api.github.com', // should be api.github.com for GitHub
  // pathPrefix: '', // for some GHEs; none for GitHub
  timeout: 5000,
  headers: {
    'user-agent': 'My-Cool-GitHub-App' // GitHub is happy with a unique user agent
  }
});

