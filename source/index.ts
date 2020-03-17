#! /usr/bin/env node

import { join, resolve } from 'path';
import Commander from 'commander';

import { traverseFiles, loadFile, saveFile } from './File';
import { MarkdownMeta, mdx2jsx, createAsyncIndex } from './generator';

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
    const list: MarkdownMeta[] = [];

    for await (const path of traverseFiles(in_folder))
        if (/\.mdx$/.test(path)) {
            const file = join(out_folder, path.slice(in_folder.length))
                    .replace(/\\/g, '/')
                    .replace(/\.mdx$/, '.tsx'),
                { code, meta } = mdx2jsx(
                    (await loadFile(path)) + '',
                    Commander.package,
                    Commander.factory
                );

            await saveFile(file, code);

            list.push({
                path: file.slice(out_folder.length),
                meta
            });

            console.log(`[save] ${resolve(file)}`);
        }

    if (list[0])
        await saveFile(join(out_folder, 'index.ts'), createAsyncIndex(list));
})();
