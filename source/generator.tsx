import { parseMDX, stringifyMDX } from './parser';
import { ASTNode } from './type';
import { parseYAML, parseTOML, stringifyJSON } from './utility';
import { loadModule } from './File';
import './polyfill';
import { renderToStaticMarkup, createCell } from 'web-cell';

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
            path = path.replace(/\.\w+$/, '');

            return `
    {
        paths: ['${path.replace(/^\//, '').toLowerCase()}'],
        component: async () => (await import('.${path}')).Content,
        meta: ${stringifyJSON(meta)}
    }`;
        })
        .join(',')}
];`;
}

export async function* renderPages(page_folder: string, layout_folder: string) {
    const pages = (await loadModule(page_folder)).default,
        layouts = await loadModule(layout_folder);

    for (let {
        meta,
        component,
        paths: [path]
    } of pages) {
        const Layout = layouts[meta.layout];

        if (!Layout)
            throw new ReferenceError(`Can't find "${meta.layout}" layout`);

        const Content = await component();

        yield {
            path,
            code: renderToStaticMarkup(
                <Layout {...meta}>
                    <Content />
                </Layout>
            )
        };
    }
}
