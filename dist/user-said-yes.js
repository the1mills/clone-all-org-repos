'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
function userSaidYes(text) {
    return String(text || '').toLowerCase().startsWith('ye');
}
exports.default = userSaidYes;
;
