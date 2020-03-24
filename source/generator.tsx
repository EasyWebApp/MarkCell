import { parseMDX, stringifyMDX } from './parser';
import {
    ASTNode,
    PageRoute,
    GroupMap,
    PageMeta,
    GroupKey,
    LayoutMap
} from './type';
import { parseYAML, parseTOML, stringifyJSON } from './utility';
import { loadModule } from './File';
import { join } from 'path';
import { statSync } from 'fs';
import './polyfill';
import { renderToStaticMarkup, createCell } from 'web-cell';
import { groupBy } from 'web-utility';

export function mdx2jsx(
    raw: string,
    library = 'react',
    factory = 'createElement'
) {
    const { children, ...rest } = parseMDX(raw);

    const [top, component]: ASTNode[] = children.reduce(
        ([top, component], node) => {
            switch (node.type) {
                case 'yaml':
                case 'toml':
                case 'import':
                    top.children.push(node);
                    break;
                default:
                    component.children.push(node);
            }

            return [top, component];
        },
        [
            { ...rest, children: [] },
            { ...rest, children: [] }
        ]
    );

    top.children.sort(({ type }) => (type === 'import' ? -1 : 0));

    const meta = top.children
        .map(({ type, value }) =>
            type === 'yaml'
                ? parseYAML(value)
                : type === 'toml'
                ? parseTOML(value)
                : null
        )
        .filter(Boolean)[0];

    const code = `/* @jsx ${factory} */
import { ${factory}, Fragment } from '${library}';
${stringifyMDX(top)}

export function Content() {
    return <Fragment>
        ${stringifyMDX(component)}
    </Fragment>;
}`;

    return { meta, code };
}

export interface MarkdownMeta {
    path: string;
    meta: any;
}

export function createAsyncIndex(list: MarkdownMeta[]) {
    return `export default [${list
        .map(({ path, meta }) => {
            const parts = path.split('.');
            const type = parts.pop();
            path = parts.join('.');

            return `
    {
        type: '${type}',
        paths: ['${path.replace(/^\//, '').toLowerCase()}'],
        component: async () => (await import('.${path}')).Content,
        meta: ${stringifyJSON(meta)}
    }`;
        })
        .join(',')}
];`;
}

export async function buildData(page_folder: string) {
    const page_list: PageRoute[] = (await loadModule(page_folder)).default,
        groups: { [group: string]: GroupMap } = {};

    const pages = page_list
        .map(({ meta, paths: [path], type, component }) => {
            const { birthtime, mtime } = statSync(
                join(page_folder, path + '.' + type)
            );

            const page: PageMeta = {
                date: birthtime.toJSON(),
                updated: mtime.toJSON(),
                ...meta,
                categories: path.split(/\\|\//).slice(0, -1),
                path,
                component
            };
            page.archives = [page.date.slice(0, 7).replace('-', '/')];

            return page;
        })
        .sort(({ date: A }, { date: B }) => B.localeCompare(A));

    for (const key of ['authors', 'tags', 'categories', 'archives'])
        groups[key] = groupBy(pages, ({ [key as GroupKey]: list }) => list);

    return { pages, groups };
}

export async function* renderPages(
    page_folder: string,
    layout_folder: string,
    pagination = 10
) {
    const { pages, groups } = await buildData(page_folder),
        layouts: LayoutMap = await loadModule(layout_folder);

    for (const { component, ...meta } of pages) {
        const Layout = layouts[meta.layout];

        if (!Layout)
            throw new ReferenceError(`Can't find "${meta.layout}" layout`);

        const Content = await component();

        yield {
            path: meta.path,
            code: renderToStaticMarkup(
                <Layout {...meta} site={groups}>
                    <Content />
                </Layout>
            )
        };
    }

    for (const [key, group] of Object.entries({
        pages: { article: pages },
        ...groups
    })) {
        const Layout = layouts[key];

        for (let [title, list] of Object.entries(group)) {
            const page = Math.ceil(list.length / pagination);

            for (let i = 0; i < page; i++) {
                const pages = list.slice(pagination * i, pagination * (i + 1));

                yield {
                    path:
                        key === 'pages' && !i
                            ? ''
                            : join(key, title, i + 1 + ''),
                    code: renderToStaticMarkup(
                        <Layout title={title} pages={pages} site={groups} />
                    )
                };
            }
        }
    }
}
