import { createCell } from 'web-cell';
import { PageProps } from '../source/type';

function Frame({
    site: { authors, tags, archives, categories },
    title,
    defaultSlot
}: PageProps) {
    const nav_map = { authors, tags, archives, categories };

    return (
        <html>
            <head>
                <title>{title}</title>
                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/bootstrap@4.4.1/dist/css/bootstrap.min.css"
                />
                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/prismjs@1.19.0/themes/prism-okaidia.css"
                />
                <base href="/" />
            </head>
            <body className="container">
                <h1>{title}</h1>
                <div className="d-flex">
                    <main className="flex-fill">{defaultSlot}</main>
                    <aside>
                        {Object.entries(nav_map).map(([type, map]) => (
                            <nav>
                                <h3>{type}</h3>
                                <ul>
                                    {Object.entries(map).map(([title]) => (
                                        <li>
                                            <a href={`${type}/${title}`}>
                                                {title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        ))}
                    </aside>
                </div>
            </body>
        </html>
    );
}

export function article({ defaultSlot, ...props }: PageProps) {
    return <Frame {...props}>{defaultSlot}</Frame>;
}

function GroupFrame({ pages, defaultSlot, ...props }: PageProps) {
    return (
        <Frame {...props}>
            {pages.map(({ path, title, date, authors }) => (
                <section>
                    <h2>
                        <a href={path}>{title}</a>
                    </h2>
                    {new Date(date).toLocaleString()} created by{' '}
                    {authors?.join(', ')}
                </section>
            ))}
        </Frame>
    );
}

export function pages(props: PageProps) {
    if (!props.path) props.title = process.env.npm_package_name;

    return <GroupFrame {...props} />;
}

export function authors({ title, ...rest }: PageProps) {
    title = 'Author: ' + title;

    return <GroupFrame title={title} {...rest} />;
}

export function archives({ title, ...rest }: PageProps) {
    title = 'Archive: ' + title;

    return <GroupFrame title={title} {...rest} />;
}

export function categories({ title, ...rest }: PageProps) {
    title = 'Category: ' + title;

    return <GroupFrame title={title} {...rest} />;
}

export function tags({ title, ...rest }: PageProps) {
    title = 'Tag: ' + title;

    return <GroupFrame title={title} {...rest} />;
}
