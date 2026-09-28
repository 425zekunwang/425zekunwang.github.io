// 本文件由 scripts/sync-pages-sites.mjs 自动生成，请勿手动编辑。
// 重新生成：pnpm sync:sites

export interface PagesSite {
  /** 仓库名 */
  name: string;
  /** 展示标题 */
  title: string;
  /** 站点地址 */
  url: string;
  /** 仓库地址 */
  repo: string;
  description: string;
  language: string;
  stars: number;
  /** 最近一次推送日期 */
  pushedAt: string;
  /** fork 过来的仓库 */
  isFork: boolean;
  /** 是否属于「用户主页」站点（部署在域名根路径） */
  isUserSite: boolean;
}

export interface OtherRepo {
  name: string;
  repo: string;
  description: string;
  language: string;
  stars: number;
  pushedAt: string;
  isFork: boolean;
}

/** 同步时间 */
export const SITES_SYNCED_AT = "2026-09-28T03:38:13.624Z";
export const SITES_SYNCED_USER = "425zekunwang";

export const PAGES_SITES: PagesSite[] = [
  {
    "name": "425zekunwang.github.io",
    "repo": "https://github.com/425zekunwang/425zekunwang.github.io",
    "description": "你现在正在看的这个站：Astro + Frosti 构建的纯静态博客，含读书笔记与逆向笔记。",
    "language": "Astro",
    "stars": 0,
    "pushedAt": "2026-09-28",
    "isFork": false,
    "title": "本站 · wzk 的技术笔记",
    "url": "https://425zekunwang.github.io/",
    "isUserSite": true,
  },
  {
    "name": "android_reverse_simulator",
    "repo": "https://github.com/425zekunwang/android_reverse_simulator",
    "description": "把 32 章 Android 逆向课程做成零依赖的纯静态站点：52 个跑得出真实结果的实验、170 道苏格拉底式追问、600+ 交互组件。",
    "language": "JavaScript",
    "stars": 0,
    "pushedAt": "2026-09-28",
    "isFork": false,
    "title": "安卓高级研修班 · 交互式模拟器",
    "url": "https://425zekunwang.github.io/android_reverse_simulator/",
    "isUserSite": false,
  },
];

/** 没有开启 Pages 的其它公开仓库 */
export const OTHER_REPOS: OtherRepo[] = [
  {
    "name": "ScrcpyOverWebRTC",
    "repo": "https://github.com/425zekunwang/ScrcpyOverWebRTC",
    "description": "A high-performance, web-based Android remote control solution powered by scrcpy and WebRTC. Control your devices with ultra-low latency directly from your browser.",
    "language": "",
    "stars": 0,
    "pushedAt": "2026-06-06",
    "isFork": true,
  },
  {
    "name": "jshookmcp",
    "repo": "https://github.com/425zekunwang/jshookmcp",
    "description": "js hook toolkit that all you need",
    "language": "",
    "stars": 0,
    "pushedAt": "2026-05-10",
    "isFork": true,
  },
  {
    "name": "civ6-mcp",
    "repo": "https://github.com/425zekunwang/civ6-mcp",
    "description": "An MCP server that lets LLM agents play Civilization VI.",
    "language": "",
    "stars": 0,
    "pushedAt": "2026-05-09",
    "isFork": true,
  },
  {
    "name": "AutoJs6",
    "repo": "https://github.com/425zekunwang/AutoJs6",
    "description": "安卓平台 JavaScript 自动化工具 (Auto.js 二次开发项目)",
    "language": "",
    "stars": 0,
    "pushedAt": "2026-03-16",
    "isFork": true,
  },
  {
    "name": "chrome-devtools-mcp",
    "repo": "https://github.com/425zekunwang/chrome-devtools-mcp",
    "description": "Chrome DevTools for coding agents",
    "language": "",
    "stars": 0,
    "pushedAt": "2026-03-08",
    "isFork": true,
  },
  {
    "name": "jshook-skill",
    "repo": "https://github.com/425zekunwang/jshook-skill",
    "description": "  AI-powered JS reverse engineering: deobfuscation, crypto detection, CDP debugging, hook injection, anti-detection |   AI驱动JS逆向：反混淆、加密识别、CDP调试、Hook注入、反检测",
    "language": "",
    "stars": 0,
    "pushedAt": "2026-02-11",
    "isFork": true,
  },
  {
    "name": "never-jscore",
    "repo": "https://github.com/425zekunwang/never-jscore",
    "description": "基于rust deno_core开发封装的v8引擎库,用于python高性能执行js.(execjs的上位替代品)",
    "language": "",
    "stars": 0,
    "pushedAt": "2026-01-30",
    "isFork": true,
  },
  {
    "name": "TiebaLite",
    "repo": "https://github.com/425zekunwang/TiebaLite",
    "description": "贴吧 Lite",
    "language": "",
    "stars": 0,
    "pushedAt": "2026-01-29",
    "isFork": true,
  },
  {
    "name": "SeaMoon",
    "repo": "https://github.com/425zekunwang/SeaMoon",
    "description": "月海 (Sea Moon) 是一款 FaaS/BaaS 实现的 Serverless 网络工具",
    "language": "",
    "stars": 0,
    "pushedAt": "2026-01-21",
    "isFork": true,
  },
  {
    "name": "indate-cdp-tools-mcp",
    "repo": "https://github.com/425zekunwang/indate-cdp-tools-mcp",
    "description": "MCP server that connects AI assistants to Chrome DevTools Protocol for runtime debugging - set breakpoints, inspect variables, monitor network traffic, and automate browser interactions",
    "language": "",
    "stars": 0,
    "pushedAt": "2025-12-19",
    "isFork": true,
  },
  {
    "name": "proxy_pool",
    "repo": "https://github.com/425zekunwang/proxy_pool",
    "description": "Python ProxyPool for web spider",
    "language": "",
    "stars": 0,
    "pushedAt": "2025-11-20",
    "isFork": true,
  },
  {
    "name": "payload-dumper-go",
    "repo": "https://github.com/425zekunwang/payload-dumper-go",
    "description": "an android OTA payload dumper written in Go",
    "language": "",
    "stars": 0,
    "pushedAt": "2025-06-02",
    "isFork": true,
  },
  {
    "name": "noname-for-dummies",
    "repo": "https://github.com/425zekunwang/noname-for-dummies",
    "description": "无名杀懒人包（棘手怀念摧毁）",
    "language": "",
    "stars": 0,
    "pushedAt": "2025-05-01",
    "isFork": true,
  },
  {
    "name": "clash-for-linux",
    "repo": "https://github.com/425zekunwang/clash-for-linux",
    "description": "clash-for-linux",
    "language": "Shell",
    "stars": 0,
    "pushedAt": "2025-03-29",
    "isFork": true,
  },
  {
    "name": "wechatmp2markdown",
    "repo": "https://github.com/425zekunwang/wechatmp2markdown",
    "description": "微信公众号文章转Markdown",
    "language": "",
    "stars": 0,
    "pushedAt": "2025-03-13",
    "isFork": true,
  },
  {
    "name": "csghub",
    "repo": "https://github.com/425zekunwang/csghub",
    "description": "CSGHub is a brand-new open-source platform for managing LLMs, developed by the OpenCSG team. It offers both open-source and on-premise/SaaS solutions, with features comparable to Hugging Face. Gain full control over the lifecycle of LLMs, datasets, and agents, with Python SDK compatibility with Hugging Face. Join us! ⭐️",
    "language": "",
    "stars": 0,
    "pushedAt": "2025-02-28",
    "isFork": true,
  },
  {
    "name": "openFpchromium",
    "repo": "https://github.com/425zekunwang/openFpchromium",
    "description": "openFpchromium,支援v114 chromium   开发 开源指纹游览器",
    "language": "",
    "stars": 0,
    "pushedAt": "2024-05-09",
    "isFork": true,
  },
  {
    "name": "Security_Codes_Tools",
    "repo": "https://github.com/425zekunwang/Security_Codes_Tools",
    "description": "个人安全开发代码缩编：包括但不扩展渗透测试，资产收集，大规模裂缝扫描器，网络安全相关资料文档",
    "language": "",
    "stars": 0,
    "pushedAt": "2019-10-25",
    "isFork": true,
  },
];
