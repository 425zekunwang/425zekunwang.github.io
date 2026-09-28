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
| 站点页数据（自动生成，勿手改） | `src/data/pages-sites.ts` ← `pnpm sync:sites` |

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

## 三个自动化脚本

```bash
pnpm import:notes                 # 把 E:/workspace/read_book 的读书笔记导入成文章
pnpm import:notes -- "D:/其他目录"  # 指定别的源目录
pnpm import:zhihu                 # 把 E:/workspace/read_book/zhihu-我的收藏 的知乎收藏导入
pnpm import:zhihu -- "D:/其他目录"  # 指定别的源目录
pnpm sync:sites                   # 扫描 GitHub 上开启了 Pages 的仓库，更新 /sites 页面数据
```

- **`import:notes`**：正文首个 `# 标题` 会变成文章标题，`§0 一句话模型` 会变成摘要，
  发布日期取文件修改时间。新增书目时在脚本的 `MAP` 里加一行英文 slug 映射再跑一次即可。
- **`import:zhihu`**：扫描源目录的四个分类目录，把 71 篇写成 `src/content/blog/zhihu/<分类>/`，
  图片复制到 `zhihu/images/`（正文里的 `../images/xxx` 相对引用因此原样可用），
  配套的交互页面复制到 `public/zhihu/labs/`，并生成一篇置顶总索引 `zhihu-library.md`。
  新增条目时在脚本的 `SLUGS` 里按文件名前缀的序号加一行即可。详见下一节。
- **`sync:sites`**：只扫公开仓库，用 GitHub API 判断哪些开了 Pages。
  部署时（`.github/workflows/deploy.yml`）会自动跑一次，所以别处新开的 Pages 不用改代码就会出现；
  API 失败时会保留仓库里已提交的数据，不会让构建挂掉。

## 知乎收藏（`src/content/blog/zhihu/`）

这个目录下的内容全部由 `pnpm import:zhihu` 生成，**不要手改**——重跑脚本会整目录覆盖。

```text
src/content/blog/zhihu/
  zhihu-library.md     置顶总索引（71 篇目录 + 交互页面入口）
  tech/                硬知识推演 33 篇
  opinion/             观点推演  25 篇
  works/               作品解读   5 篇
  career/              职场与成长 8 篇
  images/              236 张正文配图，被 `../images/xxx.png` 引用
public/zhihu/labs/     15 个配套交互页面 + 1 个合集首页，访问 /zhihu/labs/
```

约定：

- **序号只留在源文件名里**，不进标题也不进 URL。源文件是 `052-行列式的本质是什么？.md`，
  产出是 `tech/what-is-a-determinant-really.md`，URL 是 `/blog/zhihu/tech/what-is-a-determinant-really`。
- **slug 必须是 ASCII**。文章分享图（`src/pages/og/[...slug].png.ts`）会校验 slug，
  中文文件名对应的分享图会被跳过，所以序号 → slug 的映射表写在脚本的 `SLUGS` 里。
- **作者名进 `tags`**，列表页卡片上就能看到是谁写的，点进去是该作者被收录的全部篇目。
- **正文顶部的署名引用块保留**（`> 作者：… ｜ 赞同 … ｜ [原文](…)`）。
  这是别人的文章，出处必须跟着正文走。
- 交互页面里原本用 `052-标题` 指代源文件的写法，会被脚本改写成指向新文章的链接。

## 部署

推送到 `main` 分支即可。`.github/workflows/deploy.yml` 会安装依赖、跑一次 `pnpm sync:sites`、
构建，再通过 `actions/deploy-pages` 发布到 GitHub Pages —— 不需要在本地构建，也不需要提交 `dist/`。

仓库的 **Settings → Pages → Source** 需要是 **GitHub Actions**。

## 主题与许可

- 主题：[Frosti](https://github.com/EveSunMaple/Frosti)，GPL-3.0（见 `LICENSE`）
- 主题中文文档：[docs/README.zh-CN.md](docs/README.zh-CN.md)
- 站内文章：CC BY-NC-SA 4.0
