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
    categories?: string[];
    tags?: string[];
}
