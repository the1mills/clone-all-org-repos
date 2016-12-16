

const asyncNoop = function (text, cb) {
    process.nextTick(function () {
        cb(null, text);
    });
};

module.exports = function setData(prompt, fn) {

    fn = fn || asyncNoop;

    return function captureData(cb) {

        var called = false;

        const to = setTimeout(function () {
            first(new Error('User response was not received.'));
        }, 200000);

        function first() {
            if (!called) {
                clearTimeout(to);
                called = true;
                cb.apply(null, arguments);
            }
            else {
                console.log.apply(console, arguments);
            }
        }

        console.log(' ~ caGor says ~> ', prompt);

        process.stdin.on('data', function (text) {
            process.stdin.removeAllListeners();
            const userResponse = String(text).trim();
            fn(userResponse, first);
        });
    }
};