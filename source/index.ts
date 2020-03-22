#! /usr/bin/env node

import { join, resolve } from 'path';
import Commander from 'commander';

import { traverseFiles, loadFile, saveFile } from './File';
import { MarkDown } from './utility';
import {
    MarkdownMeta,
    mdx2jsx,
    createAsyncIndex,
    renderPages
} from './generator';

Commander.name('mark-cell')
    .version('0.4.0-alpha.0')
    .description('General MDX to TSX converter')
    .usage('[path] [options]')
    .option(
        '-p, --package <name>',
        'NPM package name of the Component Engine',
        /^[\w-]+$/
    )
    .option('-f, --factory <name>', 'Function name of JSX factory', /^\w+$/)
    .option('-l, --layout <path>', 'Path of Layouts module')
    .parse(process.argv);

const [
    in_folder = '.',
    out_folder = join(in_folder, '../dist')
] = Commander.args;

(async () => {
    const list: MarkdownMeta[] = [];

    for await (const path of traverseFiles(in_folder))
        if (MarkDown.test(path)) {
            const file = join(out_folder, path.slice(in_folder.length))
                    .replace(/\\/g, '/')
                    .replace(MarkDown, '.tsx'),
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

    if (!list[0]) return;

    await saveFile(join(out_folder, 'index.ts'), createAsyncIndex(list));

    if (!Commander.layout) return;

    for await (let { path, code } of renderPages(
        out_folder,
        Commander.layout
    )) {
        path = join(in_folder, '../public', path, 'index.html');

        await saveFile(path, code);

        console.log('[save] ' + resolve(path));
    }
})();
