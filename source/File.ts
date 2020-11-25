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

    return new Promise<void>((resolve, reject) =>
        writeFile(path, data, error => (error ? reject(error) : resolve()))
    );
}

const module_path = join(module.filename, '../');

register({
    ignore: [],
    compiler: 'ttypescript',
    compilerOptions: {
        module: 'CommonJS',
        plugins: [
            {
                type: 'config',
                transform: 'ts-transform-css-modules/dist/transform'
            },
            {
                transform: 'ts-transform-asset',
                assetsMatch: '\\.svg$',
                targetName: 'assets/[name]-[hash].[ext]'
            }
        ]
    }
});

export function loadModule(path: string) {
    return import(relative(module_path, resolve(path)));
}
