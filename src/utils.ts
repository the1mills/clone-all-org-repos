'use strict';

import chalk from "chalk";


export const  userSaidYes = (text: string): boolean => {
  return String(text || '').trim().toLowerCase().startsWith('y');
};

export const promptStr = (str: string) => {
  return chalk.blueBright(str);
};