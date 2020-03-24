import { promises, statSync, existsSync, mkdirSync, writeFile } from 'fs';
import { join, relative, resolve } from 'path';
import { register } from 'ts-node';

export async function* traverseFiles(folder: string): AsyncGenerator<string> {
    for (const name of await promises.readdir(folder)) {
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

register({ compilerOptions: { module: 'CommonJS' } });

export function loadModule(path: string) {
    return import(relative(module_path, resolve(path)));
}
