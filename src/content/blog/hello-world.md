---
title: 博客开张
description: 用 Astro + Frosti 搭起来的技术笔记。这篇交代一下这个站写什么、怎么搭的，以及以后怎么加新文章。
pubDate: 2026-09-28
categories: [随笔]
tags: [Astro, 建站]
draft: false
---

之前的技术笔记散在本地 Markdown、浏览器收藏夹和各种聊天记录里，需要的时候翻不到。所以开了这个站，把值得留下来的东西集中写在这儿。

主要会写 Android 逆向和移动安全：脱壳、反调试、Frida、静态分析、工具链。也会写一些「怎么把复杂的东西讲清楚」的思考——教学材料里最容易偷懒的地方，就是只给结论不给动手环节。

## 加了哪些东西

- 文章按分类和标签归档，站内有全文搜索
- 深浅色主题跟随系统，也能手动切
- 代码块带行号和高亮，支持数学公式（KaTeX）
- 文章会自动生成 Open Graph 分享图
- 有 RSS，可以直接订阅

## 怎么加一篇新文章

在 `src/content/blog/` 下新建一个 Markdown（或 MDX）文件，文件名就是 URL：

```text
src/content/blog/frida-hook-libart.md  →  /blog/frida-hook-libart
```

frontmatter 必填前三项：

```yaml
---
title: 文章标题
description: 一句话摘要，会出现在列表页、分享卡和 RSS 里
pubDate: 2026-09-28
categories: [Android 逆向]
tags: [frida, android]
draft: false
---
```

两个可选字段挺有用：

- `badge: Pin` —— 把这篇文章置顶到列表最前面
- `draft: true` —— 草稿，不会出现在任何列表和 RSS 里，可以放心先写着

> 文件名请用纯英文小写和连字符。分享图是按文件名生成的，中文文件名会被跳过。

## 本地预览和发布

```bash
pnpm install     # 首次
pnpm dev         # 本地预览，改文件即时刷新 → http://localhost:4321
pnpm build       # 构建到 dist/（含 Pagefind 搜索索引与分享图）
pnpm preview     # 用真实产物起一个本地服务
```

写完推到 `main` 分支就行，GitHub Actions 会自动构建并部署到 Pages，不需要在本地构建，也不用把产物提交进仓库。

## 改站点的外观和导航

站名、描述、主题色、导航菜单、头像、社交链接，全都集中在根目录的 `frosti.config.yaml` 里，改完刷新即可，不用翻组件。

以后会陆续把散落在各处的笔记整理过来。慢慢写。
