import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const runtime = 'C:/Users/MECHREVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
let markedPath;
try { markedPath = require.resolve('marked'); }
catch { markedPath = require.resolve('marked', { paths: [runtime] }); }
const { marked } = await import(pathToFileURL(markedPath));
const markdown = await fs.readFile(path.join(root, 'content.md'), 'utf8');
const knownSections = {
  '全局': ['overview', '全局概览'],
  '战斗': ['battle', '战斗决策'],
  '养成': ['progression', '养成逻辑'],
  '系统张力': ['tension', '系统张力'],
  '结语': ['conclusion', '结语']
};
const sections = [];
let subtitle = true;
let body = marked.parse(markdown).replace(/<h2>(.*?)<\/h2>/g, (_, title) => {
  if (subtitle) { subtitle = false; return `<p class="subtitle">${title}</p>`; }
  const name = title.replace(/<[^>]+>/g, '').replace(/^\d+\s*[·.、]\s*/, '').split(/[：:]/)[0];
  const [id, label] = knownSections[name] || ['section-' + createHash('sha256').update(name).digest('hex').slice(0, 10), name];
  if (sections.some(section => section.id === id)) throw new Error(`章节名称重复：${name}`);
  sections.push({ id, label });
  return `<h2 id="${id}" tabindex="-1">${title}</h2>`;
});
if (!sections.length) throw new Error('正文缺少章节');
body = body.replace('<h1>《崩坏：星穹铁道》系统拆解</h1>', '<h1><span class="game-title">《崩坏：星穹铁道》</span><span class="work-title">系统拆解</span></h1>');
body = body.replace(/<p><img src="assets\/([^"]+)\.svg" alt="([^"]*)"><\/p>/g,
  (_, name, alt) => `<figure><a class="diagram" href="assets/${name}.svg" target="_blank" rel="noopener" aria-label="查看大图：${alt}"><picture><source media="(max-width: 900px)" srcset="assets/${name}-mobile.svg"><img src="assets/${name}.svg" alt="${alt}" loading="lazy"></picture></a><figcaption>${alt}<span aria-hidden="true"> · </span><a href="assets/${name}.svg" target="_blank" rel="noopener">查看大图</a></figcaption></figure>`);
body = body.replace(/<p><img src="assets\/([^\"]+)\.png" alt="([^\"]*)"><\/p>/g,
  (_, name, alt) => `<figure><a class="diagram" href="assets/${name}.png" target="_blank" rel="noopener" aria-label="查看大图：${alt}"><img src="assets/${name}.png" alt="${alt}" loading="lazy"></a><figcaption>${alt}<span aria-hidden="true"> · </span><a href="assets/${name}.png" target="_blank" rel="noopener">查看大图</a></figcaption></figure>`);
body = body.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
const links = sections.map(({id, label}, j) => `<a href="#${id}"><span>${String(j + 1).padStart(2, '0')}</span>${label}</a>`).join('');
const document = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="基于3.5版本的《崩坏：星穹铁道》系统拆解，分析战斗决策、养成逻辑，以及新增目标与既有投入之间的取舍。">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%232454b8'/%3E%3Cpath d='M9 8h14v3H12v4h10v3H12v6H9z' fill='white'/%3E%3C/svg%3E">
<title>《崩坏：星穹铁道》系统拆解</title>
<style>
:root{color-scheme:light;--ink:#18181b;--muted:#475569;--accent:#2454b8;--paper:#fff;--canvas:#f7f8fa;--line:#dbe1e9;--soft:#eef4ff}
*{box-sizing:border-box}html{scroll-padding-top:30px}body{margin:0;background:var(--canvas);color:var(--ink);font:17px/1.85 'Microsoft YaHei','PingFang SC',sans-serif}a{color:var(--accent);text-underline-offset:4px}a:focus-visible{outline:3px solid var(--accent);outline-offset:5px}a:hover{text-decoration-thickness:2px}.skip{position:fixed;top:-100px;background:var(--paper);padding:12px;z-index:5}.skip:focus{top:8px}
header{max-width:1240px;margin:0 auto;padding:28px 28px 20px;display:flex;justify-content:space-between;gap:16px;color:var(--muted);font-size:14px;border-bottom:1px solid var(--line)}.shell{max-width:1240px;margin:auto;display:grid;grid-template-columns:180px minmax(0,1fr);gap:44px;padding:44px 28px 90px}aside{align-self:start;position:sticky;top:28px}nav{display:grid;gap:4px}nav a{min-height:46px;display:flex;align-items:center;gap:15px;text-decoration:none;color:var(--muted);font-size:15px;padding:8px 6px}nav a:hover{color:var(--accent)}nav span{font-size:12px;font-variant-numeric:tabular-nums;color:var(--accent)}article{min-width:0;background:var(--paper);padding:44px 52px 56px;border:1px solid var(--line)}h1{font-size:clamp(30px,3.1vw,43px);line-height:1.3;letter-spacing:-1px;margin:0 0 18px;font-weight:700}.subtitle{font-size:23px;line-height:1.55;color:var(--muted);margin-top:0;margin-bottom:26px}h2{font-size:26px;line-height:1.55;margin:58px 0 22px;padding-top:25px;border-top:1px solid var(--line);font-weight:700}h3{font-size:20px;line-height:1.6;margin:30px 0 12px}p{margin:17px 0}strong{font-weight:700}ul{padding-left:23px;margin:18px 0}li{margin:10px 0}figure{margin:26px 0 22px}figure img{display:block;width:100%;height:auto}figure a.diagram{display:block;border:1px solid var(--line);background:var(--paper);border-radius:10px;padding:10px;overflow:hidden}figcaption{font-size:13px;line-height:1.7;color:var(--muted);padding:10px 0 0}table{border-collapse:collapse;width:100%;font-size:15px;line-height:1.75}th,td{padding:13px 14px;text-align:left;vertical-align:top;border-bottom:1px solid var(--line);overflow-wrap:anywhere}th{background:var(--soft);font-weight:700}th:first-child,td:first-child{width:22%}.table-wrap{overflow-x:auto;margin:22px 0}article>p:first-of-type+p{font-size:14px;color:var(--muted)}article>p:last-child{margin-bottom:0}footer{color:var(--muted);font-size:13px;text-align:center;padding:0 24px 40px}
@media(max-width:1000px){.shell{grid-template-columns:140px minmax(0,1fr);gap:22px}article{padding:32px}body{font-size:16px}}
@media(max-width:760px){header{padding:18px 20px;flex-wrap:wrap;gap:4px}.shell{display:block;padding:18px 16px 48px}aside{position:static;margin:0 0 18px}nav{grid-template-columns:repeat(3,minmax(0,1fr));gap:2px 8px}nav a{font-size:13px;gap:8px;padding:5px 2px;min-height:44px}nav span{font-size:11px}article{padding:26px 20px 35px}.subtitle{font-size:20px}h2{font-size:23px;margin-top:42px}h3{font-size:18px}th,td{padding:10px 8px;font-size:14px}th:first-child,td:first-child{width:25%}figure a.diagram{padding:4px}figcaption{font-size:12px}}
@media print{body{background:#fff}header,aside,footer,.skip{display:none}.shell{display:block;padding:0}article{border:0;padding:0}h2,h3{break-after:avoid}figure,table{break-inside:avoid}a{color:inherit}}
h1 .game-title{white-space:nowrap}@media(max-width:600px){h1{font-size:clamp(24px,7vw,30px)}h1 .work-title{display:block}}
</style></head><body><a class="skip" href="#content">跳转到正文</a><header><span>系统策划作品</span><span>历史版本分析 / 3.5</span></header><div class="shell"><aside><nav aria-label="作品目录">${links}</nav></aside><article id="content">${body}</article></div><footer>《崩坏：星穹铁道》系统拆解 · 基于个人游玩体验</footer></body></html>`;
await fs.mkdir(path.join(root, 'dist'), { recursive: true });
const assetOutput = path.join(root, 'dist', 'assets');
await fs.mkdir(assetOutput, { recursive: true });
const assetNames = [...new Set([...body.matchAll(/(?:src|srcset|href)="assets\/([\w.-]+)"/g)].map(match => match[1]))];
for (const name of assetNames) await fs.copyFile(path.join(root, 'assets', name), path.join(assetOutput, name));
// 旧提案保留在制作源文件中，但不进入可发布的网页目录。
for (const name of ['04-proposal.svg', '04-proposal.png', '04-proposal-mobile.svg', '04-proposal-mobile.png']) {
  await fs.rm(path.join(assetOutput, name), { force: true });
}
await fs.writeFile(path.join(root, 'dist', 'index.html'), document);
await fs.writeFile(path.join(root, 'dist', '.nojekyll'), '');
// 作品使用独立路径，之后根目录可以接入个人主页，作品链接仍然有效。
const publishedPage = path.join(root, 'docs', 'hsr');
await fs.mkdir(path.join(publishedPage, 'assets'), { recursive: true });
await fs.writeFile(path.join(publishedPage, 'index.html'), document);
for (const name of assetNames) await fs.copyFile(path.join(root, 'assets', name), path.join(publishedPage, 'assets', name));
await fs.writeFile(path.join(root, 'docs', '.nojekyll'), '');
await fs.writeFile(path.join(root, 'docs', 'index.html'), '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="refresh" content="0;url=./hsr/"><title>系统策划作品</title></head><body><p><a href="./hsr/">阅读《崩坏：星穹铁道》系统拆解</a></p></body></html>');
console.log(JSON.stringify({output: path.join(root,'dist','index.html'), chineseCharacters: (markdown.match(/[\u4e00-\u9fff]/g)||[]).length, sections:sections.length, assets:assetNames.length}));
