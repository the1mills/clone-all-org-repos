'use strict';

export default function userSaidYes(text: string) {
    return String(text || '').toLowerCase().startsWith('ye');
};