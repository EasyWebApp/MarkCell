import unified from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import frontmatter from 'remark-frontmatter';
import remarkMdx from 'remark-mdx';
import toHAST from 'mdast-util-to-hast';
import { ASTNode } from './type';
import {
    languageClass,
    highlight,
    stringifyJSON,
    parseYAML,
    parseTOML
} from './utility';

export function parseMDX(raw: string) {
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
    }) as ASTNode;
}

export function highlightCode(node: ASTNode) {
    const { properties: { className } = {}, children } = node;

    if (className instanceof Array) {
        node.properties.className = className.map((name: string) =>
            name.replace(languageClass, raw => raw.toLowerCase())
        );

        var code_language = className.map(
            (name: string) => languageClass.exec(name)?.[1]
        )[0];
    }

    if (children[0] && code_language)
        node.children = [
            highlight(
                children.map(({ value }) => value).join(''),
                code_language
            )
        ];
}

export function stringifyElement(
    { properties, children, tagName }: ASTNode,
    innerHTML = ''
) {
    let { className = [] } = properties || {},
        code = children.find(
            ({ tagName, properties: { className } = {} }) =>
                tagName === 'code' && className
        );

    if (code) className = className.concat(code.properties.className as string);

    if (className instanceof Array) properties.className = className.join(' ');

    const props = Object.entries(properties)
            .map(([key, value]) =>
                typeof value === 'boolean'
                    ? key
                    : typeof value === 'number'
                    ? `${key}={${value}}`
                    : `${key}="${value}"`
            )
            .join(' '),
        end = !children[0] ? ' />' : `>${innerHTML}</${tagName}>`;

    return `<${tagName}${props && ' ' + props}${end}`;
}

export function stringifyMDX(node: ASTNode): string {
    if (node.tagName === 'code') highlightCode(node);

    const { type, value, children = [] } = node;

    const childNodes = children.map(stringifyMDX).filter(Boolean).join('\n');

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
        case 'element':
            return stringifyElement(node, childNodes);
    }
}
