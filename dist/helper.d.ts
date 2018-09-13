import { EVCb } from "./index";
declare const _default: {
    cleanCache(msg: string): (cb: EVCb<string>) => void;
    getOrgsList(cb: EVCb<any>): void;
    pickOrg(data: string[], cb: EVCb<any>): void;
    verifyCWD(data: string, cb: EVCb<any>): void;
    chooseRepos(org: string, cb: EVCb<string[]>): void;
};
export default _default;
