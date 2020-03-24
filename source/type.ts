import { WebCellProps, VNodeChildElement } from 'web-cell';

export interface Location {
    line: number;
    column: number;
    offset: number;
}

export interface Position {
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

export interface DocumentMeta {
    layout?: string;
    title: string;
    date?: string;
    updated?: string;
    authors?: string[];
    tags?: string[];
    [key: string]: any;
}

export interface PageRoute {
    type: string;
    paths: string[];
    component: () => Promise<Function>;
    meta: DocumentMeta;
}

export interface PageMeta extends DocumentMeta {
    path: string;
    categories: string[];
    archives?: string[];
}

export type GroupKey = 'authors' | 'tags' | 'categories' | 'archives';

export type GroupMap = { [name: string]: PageMeta[] };

export interface PageProps extends PageMeta, WebCellProps {
    site: {
        pages: PageMeta[];
        authors: GroupMap;
        tags: GroupMap;
        categories: GroupMap;
        archives: GroupMap;
    };
}

export interface GroupPageProps extends PageProps {
    pages: PageMeta[];
}

export type GroupLayout = (props: GroupPageProps) => VNodeChildElement;

export interface LayoutMap {
    article: (props: PageProps) => VNodeChildElement;
    pages: GroupLayout;
    authors?: GroupLayout;
    tags?: GroupLayout;
    categories?: GroupLayout;
    archives?: GroupLayout;
    [key: string]: (...params: any[]) => VNodeChildElement;
}
