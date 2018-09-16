'use strict';


export type EVCb<T> = (err: any, val: T) => void;


export type UserOrOrg = 'username' | 'org';

export const r2gSmokeTest =  () => {
    // r2g command line app uses this exported function
    return true;
};

