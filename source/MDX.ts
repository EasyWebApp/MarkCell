import unified from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import frontmatter from 'remark-frontmatter';
import remarkMdx from 'remark-mdx';
import toHAST from 'mdast-util-to-hast';
import parseHTML from 'rehype-parse';
import { highlightAuto } from 'highlight.js';
import { parse as parseYAML } from 'yaml';
import { parse as parseTOML } from 'toml';

interface Location {
    line: number;
    column: number;
    offset: number;
}

interface Position {
    start: Location;
    end: Location;
}

export interface ASTNode {
    type: 'root' | 'text' | 'element' | 'import' | 'jsx' | 'yaml' | 'toml';
    value?: string;
    position: Position;
    tagName?: string;
    properties?: any;
    children?: ASTNode[];
}

export function parseMDX(raw: string): ASTNode {
    const result = unified()
        .use(remarkParse)
        .use(remarkStringify)
        .use(frontmatter, ['yaml', 'toml'])
        .use(remarkMdx)
        .parse(raw);

    return toHAST(result, {
        handlers: {
            yaml(h, node: ASTNode) {
                return { ...node, type: 'yaml' };
            },
            toml(h, node: ASTNode) {
                return { ...node, type: 'toml' };
            },
            import(h, node: ASTNode) {
                return { ...node, type: 'import' };
            },
            jsx(h, node: ASTNode) {
                return { ...node, type: 'jsx' };
            }
        }
    });
}

export function stringifyJSON(data: any) {
    return JSON.stringify(data, null, 4);
}

export const htmlParser = unified().use(parseHTML, { fragment: true });

export function stringifyMDX({
    type,
    value,
    tagName,
    properties = {},
    children = []
}: ASTNode): string {
    const code_language =
        tagName === 'code' &&
        properties.className?.map(
            (name: string) => /language-(\w+)/.exec(name)?.[1]
        )[0];

    if (children[0] && code_language)
        children = [
            htmlParser.parse(
                highlightAuto(children.map(({ value }) => value).join('')).value
            ) as ASTNode
        ];

    const childNodes = children
        .map(node => stringifyMDX(node))
        .filter(Boolean)
        .join('\n');

    value = value?.trim()
    
    switch (type) {
        case 'root':
            return childNodes.replace(/\n+/g, '\n');
        case 'yaml':
            return `export const meta = ${stringifyJSON(parseYAML(value))}`;
        case 'toml':
            return `export const meta = ${stringifyJSON(parseTOML(value))}`;
        case 'import':
        case 'jsx':
            return value;
        case 'text':
            return value && `{\`${value}\`}`;
        case 'element': {
            const props = Object.entries(properties)
                    .map(([key, value]) =>
                        typeof value === 'boolean'
                            ? key
                            : typeof value === 'number'
                            ? `${key}={${value}}`
                            : `${key}="${value}"`
                    )
                    .join(' '),
                end = !children[0] ? ' />' : `>${childNodes}</${tagName}>`;

            return `<${tagName}${props && ' ' + props}${end}`;
        }
    }
}

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
