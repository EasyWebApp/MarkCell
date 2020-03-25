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
    categories?: string[];
    archives?: string[];
}

export interface GroupPageMeta extends PageMeta {
    pages: PageMeta[];
}

export enum GroupKeys {
    authors,
    tags,
    categories,
    archives
}
export type GroupKey = keyof typeof GroupKeys;

export type GroupPageMap = {
    [group in GroupKey]: { [name: string]: GroupPageMeta[] };
};

export interface PageProps extends PageMeta, WebCellProps {
    prev?: PageMeta;
    next?: PageMeta;
    pages?: PageMeta[];
    site: GroupPageMap & {
        posts: PageMeta[];
        pages: GroupPageMeta[];
    };
}

export type LayoutComponent = (props: PageProps) => VNodeChildElement;

export interface LayoutMap {
    article: LayoutComponent;
    pages: LayoutComponent;
    authors?: LayoutComponent;
    tags?: LayoutComponent;
    categories?: LayoutComponent;
    archives?: LayoutComponent;
    [key: string]: LayoutComponent;
}
