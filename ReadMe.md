# MarkCell

General [MDX][1] to [TSX][2] converter

[![NPM Dependency](https://david-dm.org/EasyWebApp/MarkCell.svg)][3]

[![NPM](https://nodei.co/npm/mark-cell.png?downloads=true&downloadRank=true&stars=true)][4]

## Example

```shell
npm install web-cell
npm install mark-cell -D
```

`package.json`

```json
{
    "scripts": {
        "build": "mark-cell source/ --package web-cell --factory createCell"
    }
}
```

`index.html`

```html
<head>
    <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/prismjs@1.19.0/themes/prism-okaidia.css"
    />
</head>
```

## User Cases

https://bootstrap.web-cell.dev/

[1]: https://mdxjs.com/
[2]: https://www.typescriptlang.org/docs/handbook/jsx.html
[3]: https://david-dm.org/EasyWebApp/MarkCell
[4]: https://nodei.co/npm/mark-cell/