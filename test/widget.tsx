import { WebCellProps, createCell } from 'web-cell';

interface ExampleProps extends WebCellProps {
    title?: string;
}

export function Example({ title, defaultSlot }: ExampleProps) {
    return (
        <div className="border bg-white p-3" title={title}>
            {defaultSlot}
        </div>
    );
}
