import unified from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import frontmatter from 'remark-frontmatter';
import remarkMdx from 'remark-mdx';
import toHAST from 'mdast-util-to-hast';
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
    value: string;
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
            yaml(h, node) {
                return { ...node, type: 'yaml' };
            },
            toml(h, node) {
                return { ...node, type: 'toml' };
            },
            import(h, node) {
                return { ...node, type: 'import' };
            },
            jsx(h, node) {
                return { ...node, type: 'jsx' };
            }
        }
    });
}

export function stringifyJSON(data: any) {
    return JSON.stringify(data, null, 4);
}

export function stringifyMDX(
    { type, value, tagName, properties, children }: ASTNode,
    depth = 0
): string {
    const childNodes = children
            ?.map(node => stringifyMDX(node, depth + 1))
            .filter(Boolean)
            .join('\n'),
        indent = tagName === 'code' ? '' : ' '.repeat(4 * depth);

    value = value?.trim();

    switch (type) {
        case 'root':
            return childNodes.replace(/\n+/g, '\n');
        case 'yaml':
            return `export const meta = ${stringifyJSON(parseYAML(value))}`;
        case 'toml':
            return `export const meta = ${stringifyJSON(parseTOML(value))}`;
        case 'import':
            return value;
        case 'text':
            return value && `{\`${value}\`}`;
        case 'jsx':
            return indent + value;
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

            return `${indent}<${tagName}${props && ' ' + props}${end}`;
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

    return `/* @jsx ${factory} */
import { ${factory}, Fragment } from '${library}';
${stringifyMDX(top)}

export function Content() {
    return <Fragment>
        ${stringifyMDX(component, 1)}
    </Fragment>;
}`;
}

export function createAsyncIndex(list: string[]) {
    return `export default [${list
        .map(file => {
            file = file.replace(/\.\w+$/, '');

            return `
    {
        paths: ['${file.replace(/^\//, '')}'],
        component: async () => (await import('.${file}')).Content,
        meta: async () => (await import('.${file}')).meta
    }`;
        })
        .join(',')}
];`;
}
