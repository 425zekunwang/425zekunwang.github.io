#!/usr/bin/env node
/**
 * 把「直觉模型」读书笔记导入成博客文章。
 *
 *   pnpm import:notes                      # 默认从 E:/workspace/read_book 读取
 *   pnpm import:notes -- "D:/some/dir"     # 指定源目录
 *
 * 转换规则：
 *   - 正文第一行的 `# 标题` 提取为 frontmatter 的 title，并从正文里移除
 *     （文章页会单独渲染标题，留在正文里会重复）
 *   - `§0 一句话模型` 下面的引用行提取为 description（列表页与分享卡用）
 *   - 发布日期取文件的最后修改时间，不编造
 *   - 文件名不是 ASCII，而分享图路由只接受 ASCII slug，所以这里用固定映射表给出英文 slug
 *
 * 新增一本书时：把文件放进源目录，然后在 MAP 里加一行，再跑一次即可。
 */
import fs from "node:fs";
import path from "node:path";

const SRC = process.argv[2] ?? "E:/workspace/read_book";
const OUT = path.resolve("src/content/blog/reading");

/** 文件名（不含扩展名） -> { slug, tags, desc? } */
const MAP = {
  "小岛经济学-直觉模型": { slug: "how-an-economy-grows", tags: ["经济学"] },
  "博弈论-直觉模型": { slug: "game-theory", tags: ["决策", "博弈论"] },
  "乌合之众-直觉模型": { slug: "the-crowd", tags: ["心理学", "群体"] },
  "资本论-直觉模型": { slug: "das-kapital", tags: ["经济学", "政治经济学"] },
  "国富论-直觉模型": { slug: "the-wealth-of-nations", tags: ["经济学", "政治经济学"] },
  "政治经济学原理-直觉模型": {
    slug: "principles-of-political-economy",
    tags: ["经济学", "政治经济学"],
  },
  "曼昆微观经济学原理-直觉模型": { slug: "mankiw-microeconomics", tags: ["经济学"] },
  "曼昆宏观经济学原理-直觉模型": { slug: "mankiw-macroeconomics", tags: ["经济学"] },
  "置身事内-直觉模型": { slug: "china-government-and-economy", tags: ["经济学", "中国经济"] },
  "思考快与慢-直觉模型": { slug: "thinking-fast-and-slow", tags: ["心理学", "决策"] },
  "认知觉醒-直觉模型": { slug: "cognitive-awakening", tags: ["认知", "心理学"] },
  "佛畏系统-直觉模型": { slug: "fowei-system", tags: ["认知", "决策"] },
  "人比AI凶-直觉模型": { slug: "humans-vs-ai", tags: ["认知", "AI"] },
  "营销管理-直觉模型": { slug: "marketing-management", tags: ["商业", "营销"] },
  "专业投机原理-直觉模型": { slug: "professional-speculation", tags: ["投资", "交易"] },
  "管道的故事-直觉模型": { slug: "the-pipeline-story", tags: ["商业", "投资"] },
  "枪炮病菌与钢铁-直觉模型": { slug: "guns-germs-and-steel", tags: ["历史"] },
  "熵增与时间箭头-直觉模型": { slug: "entropy-and-time", tags: ["物理"] },
  "控制论-信息论-系统论_要点与直觉模型": {
    slug: "cybernetics-information-systems",
    tags: ["系统论", "控制论"],
    // 这一篇用的是另一套章节编号（零/一/二），没有 §0，摘要手动给
    desc: "控制论、信息论、系统论是同一套思路的三个切面：把对象看成系统，用信息描述状态，用反馈描述调节。",
  },
};

const CATEGORY = "读书笔记";

function fmtDate(date) {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
}

/** 去掉 markdown 强调标记，用于生成纯文本摘要 */
function plain(text) {
  return text
    .replace(/\*\*/g, "")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1$2")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** 取第一行 `# 标题` */
function extractTitle(lines) {
  const idx = lines.findIndex((line) => /^#\s+\S/.test(line));
  if (idx === -1) return { title: null, bodyStart: 0 };
  const title = plain(lines[idx].replace(/^#\s+/, ""));
  return { title, bodyStart: idx + 1 };
}

/** 取 `§0` 下面的连续 `> ##` 引用行 */
function extractSummary(lines) {
  const start = lines.findIndex((line) => /^##\s*§?\s*0\b|^##\s*零\b/.test(line));
  if (start === -1) return "";
  const parts = [];
  for (let i = start + 1; i < Math.min(start + 14, lines.length); i++) {
    const m = lines[i].match(/^>\s*##\s*(.+)$/);
    if (m) parts.push(m[1]);
    else if (parts.length) break;
  }
  return plain(parts.join(" "));
}

function yamlValue(value) {
  // YAML 是 JSON 的超集，用 JSON 转义最省心
  return JSON.stringify(String(value));
}

function buildFrontmatter({ title, description, pubDate, tags, badge }) {
  const lines = [
    "---",
    `title: ${yamlValue(title)}`,
    `description: ${yamlValue(description)}`,
    `pubDate: ${pubDate}`,
    `categories: [${CATEGORY}]`,
    `tags: [${tags.join(", ")}]`,
  ];
  if (badge) lines.push(`badge: ${badge}`);
  lines.push("draft: false", "---", "");
  return lines.join("\n");
}

function convert(filePath, { slug, tags, desc }, { ensureTitle } = {}) {
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/);
  const { title: h1, bodyStart } = extractTitle(lines);
  const title = h1 ?? ensureTitle ?? path.basename(filePath, ".md");
  const summary = desc ?? extractSummary(lines);

  let body = lines.slice(bodyStart).join("\n").replace(/^\s*\n+/, "");
  // 去掉正文开头的分隔线，避免标题下面先出现一条横线
  body = body.replace(/^---\s*\n+/, "");

  const description = summary || title;
  const pubDate = fmtDate(fs.statSync(filePath).mtime);

  return {
    slug,
    title,
    description,
    body: buildFrontmatter({ title, description, pubDate, tags }) + body.trimEnd() + "\n",
  };
}

// ---------------- main ----------------

if (!fs.existsSync(SRC)) {
  console.error(`源目录不存在：${SRC}`);
  process.exit(1);
}

const noteFiles = fs
  .readdirSync(SRC)
  .filter((name) => name.includes("直觉模型") && name.endsWith(".md"))
  .sort();

const unmapped = noteFiles.filter((name) => !MAP[path.basename(name, ".md")]);
if (unmapped.length) {
  console.warn("以下文件不在 MAP 里，已跳过（需要的话补一行映射）：");
  for (const name of unmapped) console.warn("  - " + name);
}

fs.mkdirSync(OUT, { recursive: true });

let written = 0;
const index = [];
for (const name of noteFiles) {
  const key = path.basename(name, ".md");
  const entry = MAP[key];
  if (!entry) continue;
  const post = convert(path.join(SRC, name), entry);
  fs.writeFileSync(path.join(OUT, `${post.slug}.md`), post.body, "utf8");
  index.push({ slug: post.slug, title: post.title });
  written++;
  console.log(`  ✓ ${name}  ->  reading/${post.slug}.md`);
}

// 总索引：README.md 作为一篇置顶文章
const readme = path.join(SRC, "README.md");
if (fs.existsSync(readme)) {
  const lines = fs.readFileSync(readme, "utf8").split(/\r?\n/);
  const { title: h1, bodyStart } = extractTitle(lines);
  const body = lines.slice(bodyStart).join("\n").replace(/^\s*\n+/, "").replace(/^---\s*\n+/, "");
  const post =
    buildFrontmatter({
      title: h1 ?? "读书直觉模型库 · 总索引",
      description:
        "把一本书的核心逻辑压成一张可以自己推演的图：一句话模型、反直觉翻转、因果回路、算术证明、策略表、诚实边界。这里是全部书目的总索引。",
      pubDate: fmtDate(fs.statSync(readme).mtime),
      tags: ["读书笔记", "索引"],
      badge: "Pin",
    }) +
    body.trimEnd() +
    "\n";
  fs.writeFileSync(path.join(OUT, "reading-library.md"), post, "utf8");
  written++;
  console.log(`  ✓ README.md  ->  reading/reading-library.md（置顶）`);
}

console.log(`\n共写入 ${written} 篇文章到 ${path.relative(process.cwd(), OUT)}`);
