#! /usr/bin/env node

import 'regenerator-runtime';
import { join, resolve } from 'path';
import { promises } from 'fs';
import Commander from 'commander';

import { traverseFiles, saveFile } from './File';
import { MarkDown, log } from './utility';
import {
    MarkdownMeta,
    mdx2jsx,
    createAsyncIndex,
    renderPages
} from './generator';

Commander.name('mark-cell')
    .version('0.4.1')
    .description('General MDX to TSX/HTML converter, inspired by Hexo & Gatsby')
    .usage('[path] [options]')
    .option(
        '-p, --package <name>',
        'NPM package name of the Component Engine',
        /^[\w-]+$/
    )
    .option('-f, --factory <name>', 'Function name of JSX factory', /^\w+$/)
    .option('-l, --layout <path>', 'Path of Layouts module')
    .option('-s, --pageSize <number>', 'Pagination size of Group pages')
    .parse(process.argv);

const [
    in_folder = '.',
    out_folder = join(in_folder, '../dist')
] = Commander.args;

(async () => {
    const list: MarkdownMeta[] = [];

    console.group('TSX');

    for await (const path of traverseFiles(in_folder))
        if (MarkDown.test(path)) {
            const file = join(out_folder, path.slice(in_folder.length))
                    .replace(/\\/g, '/')
                    .replace(MarkDown, '.tsx'),
                { code, meta } = mdx2jsx(
                    (await promises.readFile(path)) + '',
                    Commander.package,
                    Commander.factory
                );

            await saveFile(file, code);

            list.push({
                path: file.slice(out_folder.length),
                meta
            });

            log('save', resolve(file));
        }

    if (list[0]) {
        const path = join(out_folder, 'index.ts');

        await saveFile(path, createAsyncIndex(list));

        log('save', resolve(path));
    }

    console.groupEnd();

    if (!Commander.layout) return;

    console.group('HTML');

    for await (let { path, code } of renderPages(
        out_folder,
        Commander.layout,
        Commander.pageSize
    )) {
        path = join(in_folder, '../public', path, 'index.html');

        await saveFile(path, code);

        log('save', resolve(path));
    }

    console.groupEnd();
})();
