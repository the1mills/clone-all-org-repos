'use strict';

module.exports = function userSaidYes(text) {
    return ['yes', 'y', 'jeah', 'yee-haw'].indexOf(String(text).trim().toLowerCase()) >= 0;
};