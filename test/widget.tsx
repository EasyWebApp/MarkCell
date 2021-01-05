import { WebCellProps, createCell } from 'web-cell';

export function Example({ defaultSlot, ...rest }: WebCellProps) {
    return (
        <div {...rest} className="border bg-white p-3">
            {defaultSlot}
        </div>
    );
}
