import { JSDOM } from 'jsdom';

const { window } = new JSDOM();

for (const key of ['self', 'document', 'HTMLElement', 'HTMLUnknownElement'])
    globalThis[key] = window[key];
