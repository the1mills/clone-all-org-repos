'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const asyncNoop = (text, cb) => {
    process.nextTick(function () {
        cb(null, text);
    });
};
function setData(prompt, fn) {
    fn = fn || asyncNoop;
    return (cb) => {
        let called = false;
        const to = setTimeout(function () {
            first(new Error('User response was not received.'));
        }, 200000);
        function first(err, text) {
            if (!called) {
                clearTimeout(to);
                called = true;
                return cb.apply(null, arguments);
            }
            console.error.apply(console, arguments);
        }
        console.log(' ~ caGor says ~> ', prompt);
        process.stdin.once('data', function (text) {
            const userResponse = String(text).trim();
            fn(userResponse, first);
        });
    };
}
exports.default = setData;
;
