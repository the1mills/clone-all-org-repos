import { EVCb } from "./index";
declare const asyncNoop: (text: string, cb: EVCb<string>) => void;
export default function setData(prompt: string, fn?: typeof asyncNoop): (cb: EVCb<string>) => void;
export {};
