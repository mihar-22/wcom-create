# {{LIB_NAME}}

[![package-badge]][package]
[![license-badge]][license]
[![semantic-release-badge]][semantic-release]
![Release][release-badge]
[![jsdelivr-badge]][jsdelivr]

## 💿 Installation

### NPM

```bash
$: npm install {{PKG_NAME}} --save
```

### CDN

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/{{PKG_NAME}}"></script>
```

## 📖 Documentation

Documentation is currently not available.

## 🖥️ Browsers

{{LIB_NAME}} is built for the modern web and avoids bloated polyfills and outdated environments
as much as possible. It'll only support browsers that fully implement the
[Custom Elements V1][caniuse-custom-el-v1] and [CSS Parts][caniuse-css-parts] specifications.

- Edge 79+
- Firefox 72+
- Chrome 73+
- Safari 13.1+
- Opera 64+
- iOS Safari 13.7+
- Android Browser 81+
- Opera Mobile 59+
- Chrome for Android 88+

[caniuse-custom-el-v1]: https://caniuse.com/custom-elementsv1
[caniuse-css-parts]: https://caniuse.com/mdn-css_selectors_part

## 🔨 Contributing

See [CONTRIBUTING.md](./.github/CONTRIBUTING.md).

[package]: https://www.npmjs.com/package/{{PKG_NAME}}
[package-badge]: https://img.shields.io/npm/v/{{PKG_NAME}}
[license]: https://github.com/{{GITHUB_REPO}}/blob/master/LICENSE
[license-badge]: https://img.shields.io/github/license/{{GITHUB_REPO}}?color=blue
[semantic-release]: https://github.com/semantic-release/semantic-release
[semantic-release-badge]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[jsdelivr]: https://www.jsdelivr.com/package/npm/{{PKG_NAME}}
[jsdelivr-badge]: https://data.jsdelivr.com/v1/package/npm/{{PKG_NAME}}/badge?style=rounded
[release-badge]: https://github.com/{{GITHUB_REPO}}/workflows/Release/badge.svg?branch=release
