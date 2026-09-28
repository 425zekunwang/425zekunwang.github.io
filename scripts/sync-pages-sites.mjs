#!/usr/bin/env node
/**
 * 扫描某个 GitHub 用户名下所有公开仓库，找出开启了 GitHub Pages 的站点，
 * 生成 src/data/pages-sites.ts 供「站点」页渲染。
 *
 *   pnpm sync:sites                     # 用 GITHUB_TOKEN / GH_TOKEN，没有则匿名请求
 *   pnpm sync:sites -- someuser         # 指定用户名
 *
 * 设计取舍：
 *   - 只查公开仓库。博客本身是公开站，列私有仓库没有意义，而且 /users/... 端点匿名也能用，
 *     于是在 CI 里不依赖任何 token 也能跑（有 token 则配额更高）。
 *   - 网络异常时不抛错、不覆盖已有数据：宁可站点列表旧一点，也不能让整站构建失败。
 */
import fs from "node:fs";
import path from "node:path";

const USER = process.argv[2] ?? "425zekunwang";
const OUT = path.resolve("src/data/pages-sites.ts");
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

/** 仓库名 -> 展示用的标题与说明（GitHub 上没有这些字段，靠这里补） */
const OVERRIDES = {
  "425zekunwang.github.io": {
    title: "本站 · wzk 的技术笔记",
    description: "你现在正在看的这个站：Astro + Frosti 构建的纯静态博客，含读书笔记与逆向笔记。",
  },
  android_reverse_simulator: {
    title: "安卓高级研修班 · 交互式模拟器",
    description:
      "把 32 章 Android 逆向课程做成零依赖的纯静态站点：52 个跑得出真实结果的实验、170 道苏格拉底式追问、600+ 交互组件。",
  },
};

const headers = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "wzk-blog-site-sync",
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

async function api(url) {
  const response = await fetch(url, { headers });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }
  return response.json();
}

/** 有限并发，避免把 API 配额打满 */
async function mapLimit(items, limit, worker) {
  const results = [];
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

function serialize(value, indent = 0) {
  const pad = "  ".repeat(indent);
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const inner = value.map((v) => `${pad}  ${serialize(v, indent + 1)}`).join(",\n");
    return `[\n${inner},\n${pad}]`;
  }
  const entries = Object.entries(value).filter(([, v]) => v !== undefined);
  const inner = entries
    .map(([k, v]) => `${pad}  ${JSON.stringify(k)}: ${serialize(v, indent + 1)}`)
    .join(",\n");
  return `{\n${inner},\n${pad}}`;
}

function writeFile({ sites, otherRepos, syncedAt, note }) {
  const body = `// 本文件由 scripts/sync-pages-sites.mjs 自动生成，请勿手动编辑。
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

/** 同步时间${note ? `（${note}）` : ""} */
export const SITES_SYNCED_AT = ${JSON.stringify(syncedAt)};
export const SITES_SYNCED_USER = ${JSON.stringify(USER)};

export const PAGES_SITES: PagesSite[] = ${serialize(sites, 0)};

/** 没有开启 Pages 的其它公开仓库 */
export const OTHER_REPOS: OtherRepo[] = ${serialize(otherRepos, 0)};
`;

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, body, "utf8");
}

function toDate(value) {
  return typeof value === "string" ? value.slice(0, 10) : "";
}

async function main() {
  console.log(`扫描 ${USER} 的公开仓库…${TOKEN ? "（带 token）" : "（匿名，配额较低）"}`);

  const repos = await api(
    `https://api.github.com/users/${USER}/repos?per_page=100&type=owner&sort=pushed`,
  );
  if (!Array.isArray(repos)) throw new Error("未取到仓库列表");

  console.log(`  共 ${repos.length} 个公开仓库，逐个检查 Pages…`);

  const checked = await mapLimit(repos, 5, async (repo) => {
    let pages = null;
    try {
      pages = await api(`https://api.github.com/repos/${repo.full_name}/pages`);
    } catch (error) {
      console.warn(`  ! ${repo.name}: 查询 Pages 失败（${error.message}）`);
    }
    return { repo, pages };
  });

  const sites = [];
  const otherRepos = [];

  for (const { repo, pages } of checked) {
    const override = OVERRIDES[repo.name] ?? {};
    const common = {
      name: repo.name,
      repo: repo.html_url,
      description: override.description || repo.description || "",
      language: repo.language ?? "",
      stars: repo.stargazers_count ?? 0,
      pushedAt: toDate(repo.pushed_at),
      isFork: Boolean(repo.fork),
    };

    if (pages?.html_url) {
      sites.push({
        ...common,
        title: override.title || repo.name,
        url: pages.html_url,
        isUserSite: repo.name.toLowerCase() === `${USER.toLowerCase()}.github.io`,
      });
    } else {
      otherRepos.push(common);
    }
  }

  // 用户主页站点排最前，其余按最近推送时间倒序
  sites.sort((a, b) => Number(b.isUserSite) - Number(a.isUserSite) || b.pushedAt.localeCompare(a.pushedAt));

  writeFile({ sites, otherRepos, syncedAt: new Date().toISOString() });

  console.log(`\n✓ 找到 ${sites.length} 个 Pages 站点，${otherRepos.length} 个其它仓库`);
  for (const site of sites) console.log(`  - ${site.title}  ${site.url}`);
  console.log(`\n已写入 ${path.relative(process.cwd(), OUT)}`);
}

try {
  await main();
} catch (error) {
  if (fs.existsSync(OUT)) {
    // 构建不该因为一次 API 抖动而失败，保留上一次的数据
    console.warn(`\n! 同步失败，保留已有数据：${error.message}`);
    process.exit(0);
  }
  console.error(`\n! 同步失败，且没有可用的旧数据：${error.message}`);
  process.exit(1);
}
