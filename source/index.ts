#! /usr/bin/env node

import { join, resolve } from 'path';
import Commander from 'commander';
import { traverseFiles, loadFile, saveFile } from './File';
import { mdx2jsx, createAsyncIndex } from './MDX';

Commander.usage('[path] [options]')
    .option(
        '-p, --package <name>',
        'NPM package name of the Component Engine',
        /^[\w-]+$/
    )
    .option('-f, --factory <name>', 'Function name of JSX factory', /^\w+$/)
    .parse(process.argv);

const [
    in_folder = '.',
    out_folder = join(in_folder, '../dist')
] = Commander.args;

(async () => {
    const list: string[] = [];

    for await (const path of traverseFiles(in_folder))
        if (/\.mdx$/.test(path)) {
            const file = join(out_folder, path.slice(in_folder.length))
                    .replace(/\\/g, '/')
                    .replace(/\.mdx$/, '.tsx'),
                source = mdx2jsx(
                    (await loadFile(path)) + '',
                    Commander.package,
                    Commander.factory
                );

            await saveFile(file, source);

            list.push(file.slice(out_folder.length)),
                console.log(`[save] ${resolve(file)}`);
        }

    if (list[0])
        await saveFile(join(out_folder, 'index.ts'), createAsyncIndex(list));
})();
