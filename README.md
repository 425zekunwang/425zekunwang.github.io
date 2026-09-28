# wzk 的技术笔记

个人技术博客，基于 [Astro](https://astro.build/) + [Frosti](https://github.com/EveSunMaple/Frosti) 主题构建，托管在 GitHub Pages。

**线上地址：<https://425zekunwang.github.io/>**

仓库名正好是 `425zekunwang.github.io`（GitHub 的「用户主页仓库」），站点直接落在域名根路径，
所以 `astro.config.mjs` 里只设了 `site`、**没有设 `base`**。

## 常改的地方

| 想改什么 | 改哪里 |
| --- | --- |
| 站名、描述、界面语言、主题色、日期格式、每页条数 | `frosti.config.yaml` → `site` |
| 顶部菜单 | `frosti.config.yaml` → `site.menu` |
| 用户名、头像、侧边栏与页脚的社交图标 | `frosti.config.yaml` → `user` |
| 首页内容 | `src/pages/index.astro` |
| 关于页 | `src/pages/about.astro` |
| 项目页 | `src/pages/project.astro` |
| 头像 / 默认分享图 | `public/profile.png` / `public/og-default.png` |

站点地址由 `frosti.config.yaml` 里的 `user.site` 决定，它同时也是 Astro 的 `site`（影响 RSS、sitemap、canonical）。

> 头像必须是 **PNG**：文章分享图是用 satori 在构建期生成的，它不接受 SVG。

## 写一篇新文章

在 `src/content/blog/` 下新建 Markdown 或 MDX 文件，文件名就是 URL：

```text
src/content/blog/frida-hook-libart.md  →  /blog/frida-hook-libart
```

frontmatter：

```yaml
---
title: 文章标题
description: 一句话摘要，会出现在列表页、分享卡和 RSS 里
pubDate: 2026-09-28
categories: [Android 逆向] # 可选
tags: [frida, android] # 可选
image: "" # 可选，文章封面
badge: Pin # 可选，写了就置顶
draft: false # true = 草稿，不进列表和 RSS
---
```

> 文件名请用纯英文小写与连字符：分享图路由会校验 slug，中文文件名会被跳过（不影响文章本身）。

## 本地开发

```bash
pnpm install     # 首次安装依赖（本项目用 pnpm 11）
pnpm dev         # 本地预览 http://localhost:4321
pnpm build       # 构建到 dist/，含 astro check、Pagefind 搜索索引与分享图
pnpm preview     # 用真实产物起本地服务
pnpm check       # 仅做类型与错误检查
pnpm lint        # Biome 检查并修复 ./src
```

## 部署

推送到 `main` 分支即可。`.github/workflows/deploy.yml` 会用 `withastro/action` 安装依赖、构建，
再通过 `actions/deploy-pages` 发布到 GitHub Pages —— 不需要在本地构建，也不需要提交 `dist/`。

仓库的 **Settings → Pages → Source** 需要是 **GitHub Actions**。

## 主题与许可

- 主题：[Frosti](https://github.com/EveSunMaple/Frosti)，GPL-3.0（见 `LICENSE`）
- 主题中文文档：[docs/README.zh-CN.md](docs/README.zh-CN.md)
- 站内文章：CC BY-NC-SA 4.0
