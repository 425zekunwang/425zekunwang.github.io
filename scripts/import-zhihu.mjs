#!/usr/bin/env node
/**
 * 把知乎收藏夹「我的收藏」导入成博客文章。
 *
 *   pnpm import:zhihu                        # 默认从 E:/workspace/read_book/zhihu-我的收藏 读取
 *   pnpm import:zhihu -- "D:/some/dir"       # 指定源目录
 *
 * 源目录结构（抓取脚本的产物）：
 *   <分类>/NNN-标题.md     带 frontmatter 的正文（title/author/voteup/created/source ...）
 *   images/<hash>.{jpg,png,webp}           正文字体引用的图片，统一 `../images/x.png`
 *   web/*.html                             配套的交互推演页面（单文件，无外部依赖）
 *   index.md / manifest.json               抓取脚本生成的索引与元数据
 *
 * 转换规则：
 *   - 文件名里的 `NNN-` 序号不进标题（frontmatter 里的 title 本身是干净的）
 *   - 正文的 `# 标题` 一行去掉（文章页会单独渲染标题，留着会重复）；
 *     紧随其后的 `> 作者：… ｜ 赞同 … ｜ [原文](…)` 保留，这是原作者的署名
 *   - pubDate 取知乎的 created，updated 取 updated，不编造时间
 *   - description 取正文第一段（去掉署名引用块），截断到 150 字
 *   - 作者名进 tags，这样列表页卡片上就能看到是谁写的，点进去是该作者的全部收录
 *   - 图片保持 `../images/xxx` 原样不动：文章写到 `zhihu/<分类>/`，
 *     图片放在 `zhihu/images/`，相对路径天然成立
 *   - 交互页面复制到 public/zhihu/labs/，并把页面里对 `NNN-标题` 的引用改写成指向新文章的链接
 *
 * 新增条目：把文件放进源目录，在 SLUGS 里加一行（键是文件名前缀的序号），再跑一次。
 */
import fs from "node:fs";
import path from "node:path";

const SRC = process.argv[2] ?? "E:/workspace/read_book/zhihu-我的收藏";
const BLOG_OUT = path.resolve("src/content/blog/zhihu");
const LABS_OUT = path.resolve("public/zhihu/labs");
/** 文章 URL 前缀，和 src/content/blog/zhihu/... 对应 */
const URL_BASE = "/blog/zhihu";
/** 交互页面在站点上的路径 */
const LABS_URL = "/zhihu/labs";

const CATS = {
  "01-硬知识推演": { dir: "tech", name: "硬知识推演", note: "CS / 数学 / 工程 / 乐理等硬知识" },
  "02-观点推演": { dir: "opinion", name: "观点推演", note: "人文 / 社会 / 政治 / 历史 / 文学观点" },
  "03-作品解读": { dir: "works", name: "作品解读", note: "二次元 / 小说 / 影视作品解读" },
  "04-职场与成长": { dir: "career", name: "职场与成长", note: "职业 / 人生 / 方法论" },
};

const INDEX_CATEGORY = "知乎收藏";

/** 序号 -> slug。slug 必须是 ASCII：分享图路由 /og/<id>.png 只接受 [a-z0-9-/]。 */
const SLUGS = {
  "001": "how-to-reach-math-peak",
  "002": "why-0-9-repeating-equals-1",
  "003": "improve-your-game-theory-skills",
  "004": "music-theory-in-10-minutes",
  "005": "music-theory-reader-part-2",
  "006": "older-programmers-in-china",
  "007": "music-theory-reader-part-1",
  "010": "books-that-level-up-your-coding",
  "013": "mushoku-tensei-backlash",
  "014": "what-is-ai-infra",
  "015": "what-does-a-cto-do",
  "016": "mushoku-tensei-growth-narrative",
  "017": "why-psychology-is-neglected",
  "018": "crawler-engineer-turned-down-42k",
  "019": "stanford-designing-your-life-prompt",
  "020": "nothing-achieved-at-26",
  "022": "how-to-persuade-psychology",
  "024": "how-to-build-a-utopia",
  "025": "cybernetics-and-scientific-methodology",
  "026": "why-no-gap-year",
  "027": "why-mao-selected-works-matters",
  "028": "why-some-lives-seem-hacked",
  "029": "how-to-be-a-tasteful-jiahao",
  "030": "justin-sun-business-empire",
  "031": "camus-sisyphus-must-be-happy",
  "032": "the-essence-of-social-interaction",
  "033": "justin-sun-my-girlfriend-jingtian",
  "034": "is-there-a-shortcut-in-life",
  "035": "why-honest-people-struggle",
  "036": "whats-next-after-harness",
  "037": "why-you-hate-math",
  "038": "thinking-models-i-wish-i-knew-earlier",
  "039": "is-chinas-tax-burden-low",
  "040": "lost-allusions-in-classical-poetry",
  "041": "why-the-jiahao-meme-went-viral",
  "042": "why-query-and-key-are-separate",
  "043": "anime-and-bloodline-determinism",
  "044": "why-transformers-changed-deep-learning",
  "045": "lecun-on-chatgpt",
  "046": "why-big-tech-middle-management-backlash",
  "047": "algorithms-that-amazed-me",
  "048": "kongzi-in-water-margin-era",
  "049": "horo-persona-extraction",
  "051": "what-is-daomubiji-about",
  "052": "what-is-a-determinant-really",
  "053": "gaokao-is-an-algorithm-battlefield",
  "054": "make-llms-output-json",
  "055": "soros-1998-hong-kong-attack",
  "056": "how-computers-work-from-scratch",
  "057": "why-tensor-instead-of-numpy",
  "058": "conv-1x1-vs-fully-connected",
  "059": "famous-financial-frauds",
  "060": "pictures-that-show-killing-intent",
  "061": "llm-research-without-compute",
  "062": "what-foreigners-call-hash",
  "063": "why-android-doesnt-run-linux-binaries",
  "064": "abcd-in-english",
  "065": "why-retail-hates-quant",
  "066": "clean-python-architecture-4",
  "071": "json-jailbreak-for-llm",
  "072": "mcp-vs-function-calling",
  "076": "why-galois-theory-is-hard",
  "077": "android-reverse-engineering-prep",
  "080": "is-agent-just-prompt-stacking",
  "081": "fastapi-aiohttp-sse",
  "082": "what-is-manus-agent",
  "083": "why-people-defend-huixingzhen",
  "084": "brilliant-linux-kernel-designs",
  "085": "twelve-demonic-tools-and-relics",
  "087": "mcp-roots",
  "094": "why-d2l-feels-hard",
};

/**
 * 标题修正。抓取时被知乎截断的标题（结尾的 `…`）在这里还原成完整标题。
 * 目前只有一条：原文正文首行保留了完整标题。
 */
const TITLES = {
  "037": "你对数学的恨，八成是因为从没人教过你怎么“想”——这本被低估的书说透了",
};

// ---------------------------------------------------------------- helpers

/** 解析 `key: "value"` 形式的 frontmatter（值都是 JSON 风格字符串或纯数字） */
function parseFront(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) {
      try {
        v = JSON.parse(v);
      } catch {
        v = v.slice(1, -1);
      }
    }
    data[kv[1]] = v;
  }
  return { data, body: raw.slice(m[0].length) };
}

/** 去掉 markdown 标记，用于生成纯文本摘要 */
function plain(text) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1$2")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 取正文里可以当摘要用的前几段。
 * 跳过标题、引用块（署名）、代码围栏、表格、图片行、知乎话题行——这些当摘要都没意义。
 */
function usableParagraphs(body, limit = 6) {
  const out = [];
  for (const block of body.split(/\n\s*\n/)) {
    const t = block.trim();
    if (!t || /^[#>|`]/.test(t)) continue;
    if (/^!\[/.test(t)) continue;
    if (/^\[#/.test(t)) continue;
    const text = plain(t.replace(/\s*\n\s*/g, ""));
    if (text.length < 12) continue;
    out.push(text);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * 摘要：优先用第一个「够长」的段落。
 * 知乎回答经常以「谢邀。」「我劝你别建。」这种一句话开场，直接拿来当卡片摘要很难看。
 */
function summarize(body, limit = 150) {
  const paras = usableParagraphs(body);
  if (!paras.length) return "";
  const pick = paras.find((p) => p.length >= 40) ?? paras.reduce((a, b) => (b.length > a.length ? b : a));
  if (pick.length <= limit) return pick;
  const cut = pick.slice(0, limit);
  const stop = Math.max(cut.lastIndexOf("。"), cut.lastIndexOf("；"), cut.lastIndexOf("，"));
  return (stop > limit - 40 ? cut.slice(0, stop + 1) : cut) + "…";
}

/** "2026-09-22 16:26" -> "2026-09-22T16:26:00" */
function isoDate(value, fallback) {
  const m = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) return fallback ?? null;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4] ?? "00"}:${m[5] ?? "00"}:00`;
}

/** YAML 是 JSON 的超集，用 JSON 转义最省心 */
const yaml = (v) => JSON.stringify(String(v));

// ---------------------------------------------------------------- 收集

if (!fs.existsSync(SRC)) {
  console.error(`源目录不存在：${SRC}`);
  process.exit(1);
}

const posts = [];
const problems = [];

for (const [catDir, cat] of Object.entries(CATS)) {
  const full = path.join(SRC, catDir);
  if (!fs.existsSync(full)) {
    problems.push(`缺少分类目录：${catDir}`);
    continue;
  }
  for (const name of fs.readdirSync(full).filter((n) => n.endsWith(".md")).sort()) {
    const num = name.slice(0, 3);
    const slug = SLUGS[num];
    if (!slug) {
      problems.push(`SLUGS 里没有 ${num}（${name}），已跳过`);
      continue;
    }
    const raw = fs.readFileSync(path.join(full, name), "utf8");
    const { data, body } = parseFront(raw);
    const title = TITLES[num] ?? plain(String(data.title ?? "")) ?? "";
    if (/[….]+$/.test(title)) problems.push(`${num} 标题仍以省略号结尾：${title}`);

    // 去掉正文里的 `# 标题`（文章页会单独渲染标题，留着会重复）
    const lines = body.split(/\r?\n/);
    const h1 = lines.findIndex((l) => /^#\s+\S/.test(l));
    let text = (h1 === -1 ? lines : [...lines.slice(0, h1), ...lines.slice(h1 + 1)]).join("\n");
    // 少数几篇（如 037）在署名引用块之后又把标题当正文首行重复了一遍，一并去掉。
    // 只清理正文最开头这一段：空行和 `>` 引用行照原样留着，遇到第一行真内容就收手。
    const norm = (s) => s.trim().replace(/\s*[|｜]\s*$/, "").replace(/\s+/g, "");
    const kept = [];
    let header = true;
    for (const line of text.split("\n")) {
      if (header) {
        const t = line.trim();
        if (!t || t.startsWith(">")) {
          kept.push(line);
          continue;
        }
        if (norm(t) === norm(title)) continue;
        header = false;
      }
      kept.push(line);
    }
    text = kept
      .join("\n")
      .replace(/^\s*\n+/, "")
      .replace(/^---\s*\n+/, "")
      .trimEnd();

    posts.push({
      num,
      slug,
      catDir: cat.dir,
      catName: cat.name,
      url: `${URL_BASE}/${cat.dir}/${slug}`,
      title,
      author: plain(String(data.author ?? "")),
      type: String(data.type ?? ""),
      voteup: Number(data.voteup ?? 0),
      comments: Number(data.comments ?? 0),
      source: String(data.source ?? ""),
      created: isoDate(data.created),
      updated: isoDate(data.updated),
      dateOnly: isoDate(data.created)?.slice(0, 10) ?? "",
      description: summarize(text) || plain(title),
      body: text,
    });
  }
}

// slug 冲突检查
const seen = new Map();
for (const p of posts) {
  const key = `${p.catDir}/${p.slug}`;
  if (seen.has(key)) problems.push(`slug 冲突：${key}（${seen.get(key)} 与 ${p.num}）`);
  seen.set(key, p.num);
}

// ---------------------------------------------------------------- 写文章

fs.rmSync(BLOG_OUT, { recursive: true, force: true });
fs.mkdirSync(BLOG_OUT, { recursive: true });

for (const p of posts) {
  const fm = [
    "---",
    `title: ${yaml(p.title)}`,
    `description: ${yaml(p.description)}`,
    `pubDate: "${p.created}"`,
  ];
  if (p.updated && p.updated !== p.created) fm.push(`updated: "${p.updated}"`);
  fm.push(
    `categories: [${p.catName}]`,
    `tags: [${p.author}]`,
    "draft: false",
    "---",
    "",
  );
  const out = path.join(BLOG_OUT, p.catDir, `${p.slug}.md`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, fm.join("\n") + p.body + "\n", "utf8");
}

// ---------------------------------------------------------------- 图片

const imgSrc = path.join(SRC, "images");
let imgCount = 0;
if (fs.existsSync(imgSrc)) {
  const imgDst = path.join(BLOG_OUT, "images");
  fs.mkdirSync(imgDst, { recursive: true });
  for (const f of fs.readdirSync(imgSrc)) {
    fs.copyFileSync(path.join(imgSrc, f), path.join(imgDst, f));
    imgCount++;
  }
} else {
  problems.push(`缺少图片目录：${imgSrc}`);
}

// ---------------------------------------------------------------- 总索引

const byCat = new Map(Object.values(CATS).map((c) => [c.name, []]));
for (const p of posts) byCat.get(p.catName).push(p);
for (const list of byCat.values()) list.sort((a, b) => b.created.localeCompare(a.created));

const totalNewest = posts.map((p) => p.created).sort().at(-1);
const lines = [
  "---",
  `title: ${yaml("知乎收藏夹 · 我的收藏")}`,
  `description: ${yaml(
    `从知乎收藏夹「我的收藏」整理出的 ${posts.length} 篇长文：` +
      Object.values(CATS)
        .map((c) => `${c.name} ${byCat.get(c.name).length} 篇`)
        .join("、") +
      `，另附 ${fs.existsSync(path.join(SRC, "web")) ? fs.readdirSync(path.join(SRC, "web")).filter((f) => f.endsWith(".html")).length - 1 : 0} 个配套交互页面。`,
  )}`,
  `pubDate: "${totalNewest}"`,
  `categories: [${INDEX_CATEGORY}]`,
  "tags: [索引, 知乎]",
  "badge: Pin",
  "draft: false",
  "---",
  "",
  `收藏夹 ID：706004138 ｜ 收录 ${posts.length} 篇 ｜ 分类整理时间：2026-09-22`,
  "",
  "> 以下内容整理自知乎公开问答、文章与想法，版权归原作者所有。",
  "> 每篇正文开头都保留了原作者署名、赞同数与原文链接。",
  "",
  "## 目录",
  "",
];

for (const cat of Object.values(CATS)) {
  const list = byCat.get(cat.name);
  if (!list.length) continue;
  lines.push(
    `### ${cat.name} · ${list.length} 篇`,
    "",
    `<small>${cat.note} ｜ <a href="/blog/category/${cat.name}/">查看该分类</a></small>`,
    "",
    "| 标题 | 作者 | 赞同 | 发布 |",
    "| --- | --- | --- | --- |",
  );
  for (const p of list) {
    // 标题里可能有 `|`（如 018 那篇），在表格里必须转义，否则整行会被拆掉
    const cell = p.title.replace(/\|/g, "\\|");
    lines.push(`| [${cell}](${p.url}) | ${p.author} | ${p.voteup} | ${p.dateOnly} |`);
  }
  lines.push("");
}

const labFiles = fs.existsSync(path.join(SRC, "web"))
  ? fs.readdirSync(path.join(SRC, "web")).filter((f) => f.endsWith(".html") && f !== "index.html").length
  : 0;
if (labFiles) {
  lines.push(
    "## 配套交互页面",
    "",
    `整理这批收藏时顺手做了 ${labFiles} 个可交互的推演页面——把文章里的机制做成能亲手拨参数的东西。`,
    "",
    `**[→ 打开交互页面合集](${LABS_URL}/)**`,
    "",
    "包含：大模型实验室（分词／注意力／采样）、行列式实验室、乐理实验室、Linux 内核实验室、",
    "1×1 卷积实验室、Android 实验室、Python 虚拟机模拟器、控制论反馈回路、博弈场、",
    "万历十五年制度困境模拟器、以及《盗墓笔记》《无职转生》《空之境界》的解读页面。",
    "",
  );
}

fs.writeFileSync(path.join(BLOG_OUT, "zhihu-library.md"), lines.join("\n"), "utf8");

// ---------------------------------------------------------------- 交互页面

/**
 * 页面里到处用 `052-行列式的本质是什么？` 这种「序号-标题」来指代原文件。
 * 序号已经不进标题了，再留着就是断链，所以统一改写成指向新文章的链接。
 * 四条规则依次执行，每条都只在「序号后面紧跟连字符 + 中文/书名号」这种极窄的条件下命中。
 */
const byNum = new Map(posts.map((p) => [p.num, p]));
const link = (p) => `<a href="${p.url}">${p.title}</a>`;
const labStats = { r0: 0, r1: 0, r1b: 0, r2: 0, r2b: 0 };

function rewriteLabs(html) {
  // R0: `<code>zhihu-我的收藏/03-作品解读/013-标题.md</code>` 这种整条源路径 -> 文章链接。
  // 锚在 <code>…</code> 上，所以不必去猜路径前缀长什么样。
  html = html.replace(/<code>[^<>\n]*?(\d{3})-[^<>\n]*?\.md<\/code>/g, (m, num) =>
    byNum.has(num) ? (labStats.r0++, `<code>${link(byNum.get(num))}</code>`) : m,
  );

  // R1: 完整的 `NNN-标题` -> 文章链接
  for (const p of posts) {
    for (const t of new Set([p.title, p.title.replace(/[?？]$/, "")])) {
      const needle = `${p.num}-${t}`;
      if (html.includes(needle)) {
        html = html.split(needle).join((labStats.r1++, link(p)));
      }
    }
  }

  // R1b: 剩下没被完整匹配的 `NNN-`（标题在抓取时被省略号截断过），只删序号
  html = html.replace(/(\d{3})-(?=[\u4e00-\u9fff《“])/g, (m, num) =>
    byNum.has(num) ? (labStats.r1b++, "") : m,
  );

  // R2: `对应 013 / 016`、`配套 051`、`对应 084-Linux 内核设计` —— 只有序号没有完整标题的，
  // 换成文章链接；序号后面那种 `-短标签` 或一个短词一并吃掉，否则会留下一条断尾巴
  html = html.replace(
    /(对应|配套)((?:\s*\d{3}(?:\s*[/、]\s*\d{3})*)+)(?:-?[^\s<>，。]{0,12}(?:\s+[^\s<>，。]{1,8})?)?/g,
    (m, word, nums) => {
      const parts = nums.match(/\d{3}/g) ?? [];
      if (!parts.every((n) => byNum.has(n))) return m;
      labStats.r2++;
      return `${word} ${parts.map((n) => link(byNum.get(n))).join(" / ")}`;
    },
  );

  // R2b: 序号被上一步删掉、只剩标题片段的（如 `对应 如何评价《控制论与科学方法论》`），
  // 按标题前缀认领回链接
  html = html.replace(/(对应|配套)\s+([^<>\n]{4,})/g, (m, word, rest) => {
    const label = rest.trim();
    const hit = posts.find((p) => p.title.startsWith(label));
    if (!hit) return m;
    labStats.r2b++;
    return `${word} ${link(hit)}`;
  });

  return html;
}

const webSrc = path.join(SRC, "web");
let labCount = 0;
if (fs.existsSync(webSrc)) {
  fs.rmSync(LABS_OUT, { recursive: true, force: true });
  fs.mkdirSync(LABS_OUT, { recursive: true });
  for (const f of fs.readdirSync(webSrc).filter((n) => n.endsWith(".html"))) {
    let html = fs.readFileSync(path.join(webSrc, f), "utf8");
    html = rewriteLabs(html);
    if (f === "index.html") {
      html = html.replace("Local · Offline", "知乎收藏 · 交互页面");
    }
    // 每页顶部加一条返回博客的细条，否则从搜索进来的读者会走丢
    const bar =
      `<div style="position:sticky;top:0;z-index:99;display:flex;gap:16px;align-items:center;` +
      `justify-content:space-between;padding:9px 18px;background:rgba(13,17,23,.92);` +
      `backdrop-filter:blur(8px);border-bottom:1px solid #2b3444;font-size:13.5px;` +
      `font-family:'Segoe UI','Microsoft YaHei',sans-serif">` +
      `<a href="/" style="color:#8b98a8;text-decoration:none">← wzk 的技术笔记</a>` +
      (f === "index.html"
        ? ""
        : `<a href="${LABS_URL}/" style="color:#58a6ff;text-decoration:none">全部交互页面</a>`) +
      `</div>`;
    html = html.replace(/<body([^>]*)>/, (_m, attrs) => `<body${attrs}>${bar}`);
    fs.writeFileSync(path.join(LABS_OUT, f), html, "utf8");
    labCount++;
  }
} else {
  problems.push(`缺少交互页面目录：${webSrc}`);
}

// ---------------------------------------------------------------- 报告

console.log(`\n源目录：${SRC}`);
console.log(`\n【文章】${posts.length} 篇 -> ${path.relative(process.cwd(), BLOG_OUT)}`);
for (const cat of Object.values(CATS)) {
  const list = byCat.get(cat.name);
  console.log(`  ${cat.dir.padEnd(8)} ${cat.name}  ${list.length} 篇  （${list.at(-1)?.dateOnly} ~ ${list[0]?.dateOnly}）`);
}
console.log(`  置顶索引   zhihu-library.md（${posts.length} 篇 + ${labFiles} 个交互页面）`);
console.log(`\n【图片】${imgCount} 个 -> zhihu/images/`);
console.log(`【交互页面】${labCount} 个 -> ${path.relative(process.cwd(), LABS_OUT)}/${LABS_OUT.endsWith("/") ? "" : "/"}`);
console.log(
  `  序号引用改写：源路径 ${labStats.r0} 处、完整标题 ${labStats.r1} 处、裸序号 ${labStats.r1b} 处、` +
    `对应表 ${labStats.r2} 处、标题片段 ${labStats.r2b} 处`,
);
if (problems.length) {
  console.log("\n【需要注意】");
  for (const p of problems) console.log("  ! " + p);
} else {
  console.log("\n没有发现问题。");
}
