import unified from 'unified';
import parseHTML from 'rehype-parse';
import { highlight as HLParser, languages } from 'prismjs';
import loadLanguages from 'prismjs/components/';

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
    properties?: {
        className: string | string[];
        [key: string]: any;
    };
    children?: ASTNode[];
}

export function stringifyJSON(data: any) {
    return JSON.stringify(data, null, 4);
}

export const htmlParser = unified().use(parseHTML, { fragment: true });

export const languageClass = /^language-(\w+)$/;

export function highlight(code: string, language: string) {
    language = language.toLowerCase();

    if (!(language in languages)) loadLanguages([language]);

    return htmlParser.parse(
        HLParser(code, languages[language], language)
    ) as ASTNode;
}

export { parse as parseYAML } from 'yaml';
export { parse as parseTOML } from 'toml';
