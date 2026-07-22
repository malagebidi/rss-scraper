# RSS Scraper

这是一个用于将不支持 RSS 订阅的网站转换为标准 RSS Feed 的轻量级爬虫项目。本项目通常会配合 GitHub Actions 自动定时抓取目标页面，并生成可直接订阅的 `.xml` 文件，方便在各类 RSS 阅读器中进行阅读。

## 订阅地址

可以通过 GitHub Pages 订阅最新的 RSS 源（随着抓取目标或脚本的变化，这里提供的订阅源也会动态更新）：

- **极客公园（极客早知道）**: [https://malagebidi.github.io/rss-scraper/geekpark.xml](https://malagebidi.github.io/rss-scraper/geekpark.xml)

*(你可以直接将上述链接复制，并添加到你的 RSS 客户端软件中。)*

## 开发说明

- 本项目基于 Node.js，使用 `axios` 请求页面，`cheerio` 解析页面结构，并使用 `feed` 模块生成标准的 RSS XML。
- 若抓取目标发生变化，只需在 `scripts/` 下新增或修改对应的抓取脚本，并在入口文件 `index.js` 中调整输出逻辑即可。