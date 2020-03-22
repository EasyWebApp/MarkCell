import { promisify } from 'util';
import {
    readdir,
    readFile,
    statSync,
    existsSync,
    mkdirSync,
    writeFile
} from 'fs';
import { join, relative, resolve } from 'path';
import { register } from 'ts-node';

export const readFolder = promisify(readdir),
    loadFile = promisify(readFile);

export async function* traverseFiles(folder: string): AsyncGenerator<string> {
    for (const name of await readFolder(folder)) {
        const path = join(folder, name);

        if (statSync(path).isDirectory()) yield* traverseFiles(path);
        else yield path;
    }
}

export function saveFile(path: string, data: any) {
    const folder = join(path, '..');

    if (!existsSync(folder)) mkdirSync(folder, { recursive: true });

    return new Promise((resolve, reject) =>
        writeFile(path, data, error => (error ? reject(error) : resolve()))
    );
}

const module_path = join(module.filename, '../');

register();

export function loadModule(path: string) {
    return import(relative(module_path, resolve(path)));
}
