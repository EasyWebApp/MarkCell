import unified from 'unified';
import parseHTML from 'rehype-parse';
import { highlight as HLParser, languages } from 'prismjs';
import loadLanguages from 'prismjs/components/';
import { ASTNode } from './type';

export function stringifyJSON(data: any) {
    return JSON.stringify(data, null, 4);
}

export const htmlParser = unified().use(parseHTML, { fragment: true });

export const MarkDown = /\.(markdown|mdx?)$/i,
    languageClass = /^language-(\w+)$/;

export function highlight(code: string, language: string) {
    language = language.toLowerCase();

    if (!(language in languages)) loadLanguages([language]);

    return htmlParser.parse(
        HLParser(code, languages[language], language)
    ) as ASTNode;
}

export { parse as parseYAML } from 'yaml';
export { parse as parseTOML } from 'toml';

export function log(type: string, content: string) {
    console.log(`[${type}] ${content}`);
}
