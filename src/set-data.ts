'use strict';

import {EVCb} from "./index";

const asyncNoop =  (text: string, cb: EVCb<string>) => {
  process.nextTick(function () {
    cb(null, text);
  });
};

export default function setData(prompt: string, fn?: typeof asyncNoop) {

  fn = fn || asyncNoop;

  return (cb: EVCb<string>) => {

    let called = false;

    const to = setTimeout(function () {
      first(new Error('User response was not received.'));
    }, 200000);

    function first(err: any, text?: string) {
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
  }
};