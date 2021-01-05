import { extname, join } from 'path';
import { statSync } from 'fs';
import './polyfill';
import { renderToStaticMarkup, createCell, toHyphenCase } from 'web-cell';
import { groupBy } from 'web-utility';

import { parseMDX, stringifyMDX } from './parser';
import {
    ASTNode,
    PageMeta,
    GroupKey,
    GroupPageMeta,
    PageRoute,
    GroupPageMap,
    GroupKeys,
    LayoutMap
} from './type';
import { parseYAML, parseTOML, stringifyJSON } from './utility';
import { loadModule } from './File';

export function mdx2jsx(
    raw: string,
    library = 'react',
    factory = 'createElement',
    fragment = 'Fragment'
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
/* @jsxFrag ${fragment} */
import { ${factory}, ${fragment} } from '${library}';
${stringifyMDX(top)}

export function Content() {
    return <>
        ${stringifyMDX(component)}
    </>;
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
            const type = extname(path).slice(1);

            path = path.slice(0, -type.length - 1);

            const parts = path.split(/[/\\]+/g);
            const route = [...parts.slice(0, -1), toHyphenCase(parts.pop())]
                .join('/')
                .replace(/^\//, '')
                .toLowerCase();

            return `
    {
        file: '${path}.${type}',
        paths: ['${route}'],
        component: async () => (await import('.${path}')).Content,
        meta: ${stringifyJSON(meta)}
    }`;
        })
        .join(',')}
];`;
}

function* toPages(
    layout: 'pages' | GroupKey,
    title: string,
    list: PageMeta[],
    pageSize: number
): Generator<GroupPageMeta> {
    const count = Math.ceil(list.length / pageSize);

    for (let i = 0; i < count; i++) {
        const pages = list.slice(pageSize * i, pageSize * (i + 1)),
            path =
                layout === 'pages' && !i
                    ? ''
                    : join(layout, title, !i ? '' : i + 1 + '').replace(
                          /\\/g,
                          '/'
                      );
        yield { layout, title: title || layout, path, pages };
    }
}

export async function buildData(page_folder: string, pageSize: number) {
    const page_list: PageRoute[] = (await loadModule(page_folder)).default,
        groups: GroupPageMap = {} as GroupPageMap;

    const posts = page_list
        .map(({ meta, paths: [path], file, component }) => {
            const { birthtime, mtime } = statSync(join(page_folder, file));

            const page: PageMeta = {
                layout: 'article',
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

    for (const key of Object.keys(GroupKeys)) {
        const group = groupBy(posts, ({ [key as GroupKey]: list }) => list);

        for (const title in group)
            group[title] = [
                ...toPages(key as GroupKey, title, group[title], pageSize)
            ];

        groups[key] = group;
    }

    return {
        posts,
        pages: [...toPages('pages', '', posts, pageSize)],
        groups
    };
}

export async function* renderPages(
    page_folder: string,
    layout_folder: string,
    pageSize = 10
) {
    const { posts, pages, groups } = await buildData(page_folder, pageSize),
        layouts: LayoutMap = await loadModule(layout_folder);

    const site = { posts, pages, ...groups };

    for (let i = 0, meta: PageMeta; (meta = posts[i]); i++) {
        const Layout = layouts[meta.layout];

        if (!Layout)
            throw new ReferenceError(`Can't find "${meta.layout}" layout`);

        const Content = await meta.component();

        yield {
            path: meta.path,
            code: renderToStaticMarkup(
                <Layout
                    {...meta}
                    prev={posts[i + 1]}
                    next={posts[i - 1]}
                    site={site}
                >
                    <Content />
                </Layout>
            )
        };
    }

    for (const group of [{ article: pages }, ...Object.values(groups)])
        for (const list of Object.values(group))
            for (let i = 0, page: GroupPageMeta; (page = list[i]); i++) {
                const Layout = layouts[page.layout];

                if (Layout)
                    yield {
                        path: page.path,
                        code: renderToStaticMarkup(
                            <Layout
                                {...page}
                                prev={list[i + 1]}
                                next={list[i - 1]}
                                site={site}
                            />
                        )
                    };
            }
}
