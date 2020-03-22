import { WebCellProps, createCell, Fragment } from 'web-cell';
import { DocumentMeta } from '../source/type';

function Frame({ title, defaultSlot }: DocumentMeta & WebCellProps) {
    return (
        <html>
            <head>
                <title>{title}</title>
            </head>
            <body>{defaultSlot}</body>
        </html>
    );
}

export function article({ title, defaultSlot }: DocumentMeta & WebCellProps) {
    return (
        <Frame title={title}>
            <h1>{title}</h1>
            {defaultSlot}
        </Frame>
    );
}
