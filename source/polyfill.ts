import { JSDOM } from 'jsdom';
import { Crypto } from '@peculiar/webcrypto';

const { window } = new JSDOM();

for (const key of ['self', 'document', 'HTMLElement', 'HTMLUnknownElement'])
    globalThis[key] = window[key];

globalThis.crypto = new Crypto();
