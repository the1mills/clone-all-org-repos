'use strict';

export default function userSaidYes(text: string): boolean {
  return String(text || '').toLowerCase().startsWith('y');
};