import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const runtime = path.resolve(path.dirname(process.execPath), '..', 'node_modules');
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
let currentSection;
const plain = text => text.replace(/<[^>]+>/g, '');
let body = marked.parse(markdown).replace(/<h([23])>(.*?)<\/h\1>/g, (_, level, title) => {
  if (level === '3') {
    if (!currentSection) throw new Error('小节缺少所属章节');
    const number = plain(title).match(/^\d+\.\d+/)?.[0];
    const id = currentSection.id + '-' + (number?.replace('.', '-') || createHash('sha256').update(title).digest('hex').slice(0, 8));
    currentSection.subsections.push({ id, label: plain(title) });
    return `<h3 id="${id}" data-section="${currentSection.id}" tabindex="-1">${title}</h3>`;
  }
  if (subtitle) { subtitle = false; return `<p class="subtitle">${title}</p>`; }
  const name = title.replace(/<[^>]+>/g, '').replace(/^\d+\s*[·.、]\s*/, '').split(/[：:]/)[0];
  const [id, label] = knownSections[name] || ['section-' + createHash('sha256').update(name).digest('hex').slice(0, 10), name];
  if (sections.some(section => section.id === id)) throw new Error(`章节名称重复：${name}`);
  currentSection = { id, label, subsections: [] };
  sections.push(currentSection);
  return `<h2 id="${id}" data-section="${id}" tabindex="-1">${title}</h2>`;
});
if (!sections.length) throw new Error('正文缺少章节');
body = body.replace('<h1>《崩坏：星穹铁道》系统拆解</h1>', '<h1><span class="game-title">《崩坏：星穹铁道》</span><span class="work-title">系统拆解</span></h1>');
body = body.replace(/<p><img src="assets\/([^"]+)\.svg" alt="([^"]*)"><\/p>/g,
  (_, name, alt) => `<figure><a class="diagram" href="assets/${name}.svg" target="_blank" rel="noopener" aria-label="查看大图：${alt}"><picture><source media="(max-width: 900px)" srcset="assets/${name}-mobile.svg"><img src="assets/${name}.svg" alt="${alt}" loading="lazy"></picture></a></figure>`);
body = body.replace(/<p><img src="assets\/([^\"]+)\.png" alt="([^\"]*)"><\/p>/g,
  (_, name, alt) => `<figure><a class="diagram" href="assets/${name}.png" target="_blank" rel="noopener" aria-label="查看大图：${alt}"><img src="assets/${name}.png" alt="${alt}" loading="lazy"></a></figure>`);
body = body.replace(/<table>([\s\S]*?)<\/table>/g, (_, table) => {
  const headings = [...table.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map(m => m[1]);
  const rows = [...(table.split('<tbody>')[1] || '').matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(m => [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(cell => cell[1]));
  const entries = rows.map(cells => `<div class="table-entry"><h4>${cells[0]}</h4><dl>${cells.slice(1).map((value, i) => `<div><dt>${headings[i + 1]}</dt><dd>${value}</dd></div>`).join('')}</dl></div>`).join('');
  return `<div class="table-wrap"><table>${table}</table></div><div class="mobile-table" role="group" aria-label="${plain(headings[0])}对照">${entries}</div>`;
});
body = body.replace(/<p><strong>要点：<\/strong>([\s\S]*?)<\/p>/g, '<div class="takeaway"><p><strong>本章要点</strong>$1</p></div>');
body = body.replace(/<p>(分析范围：[\s\S]*?)初稿完成于([\s\S]*?)<\/p>/, '<p class="scope">$1</p><p class="provenance">初稿完成于$2</p>');
body = body.replace(/<p><strong>核心判断<\/strong><\/p>\s*<ul>/, '<p class="core-label"><strong>核心判断</strong></p><ul class="core-judgments">');
// Reuse the original screenshot in bounded CSS viewports, keeping the source image intact.
const crops = [
  {title:'行动序列',description:'先判断谁先行动，再安排增益、输出与应急处理。局部展示序列顶部。',x:85,y:28,w:98,h:170,alt:'行动序列顶部的角色与敌方头像'},
  {title:'战技点',description:'共享资源的当前余量，直接约束下一次普攻或战技的选择。',x:850,y:488,w:111,h:44,alt:'战技点区域显示当前剩余3点'},
  {title:'角色状态',description:'生命值与状态图标帮助判断生存风险和效果覆盖。局部展示一名队友。',x:169,y:471,w:125,h:73,alt:'一名队友的生命值5744与状态图标'}
];
const details = `<div class="battle-details" aria-label="战斗信息局部观察">${crops.map(c => `<div class="battle-detail"><h4>${c.title}</h4><div class="crop-stage"><div class="image-crop" style="--crop-ratio:${c.w}/${c.h};--crop-width:${1280/c.w*100}%;--crop-left:${-c.x/c.w*100}%;--crop-top:${-c.y/c.h*100}%;--crop-max:${c.w===98?110:230}px"><img src="assets/05-battle.png" alt="${c.alt}" loading="lazy"></div></div><p>${c.description}</p></div>`).join('')}</div>`;
body = body.replace(/(<figure><a[^>]+href="assets\/05-battle.png"[\s\S]*?<\/figure>)/, '$1' + details);
const links = sections.map(({id, label, subsections}, j) => `<div class="nav-group" data-section="${id}"><a class="chapter-link" href="#${id}"><span>${String(j + 1).padStart(2, '0')}</span>${label}</a><div class="subnav">${subsections.map(sub => `<a href="#${sub.id}">${sub.label}</a>`).join('')}</div></div>`).join('');
const styles = await fs.readFile(path.join(root, 'styles.css'), 'utf8');
const reader = await fs.readFile(path.join(root, 'reader.js'), 'utf8');
const document = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="基于3.5版本的《崩坏：星穹铁道》系统拆解，分析战斗决策、养成逻辑，以及新增目标与既有投入之间的取舍。">
<link rel="canonical" href="https://1986772315h-ui.github.io/game_present/hsr/">
<meta property="og:type" content="article"><meta property="og:locale" content="zh_CN">
<meta property="og:title" content="《崩坏：星穹铁道》系统拆解"><meta property="og:description" content="低操作负担下，策略与养成如何形成长期目标？基于3.5版本的系统策划分析作品。">
<meta property="og:url" content="https://1986772315h-ui.github.io/game_present/hsr/">
<meta property="og:image" content="https://1986772315h-ui.github.io/game_present/hsr/assets/06-share.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="《崩坏：星穹铁道》系统拆解：战斗决策、养成逻辑与系统张力">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%232454b8'/%3E%3Cpath d='M9 8h14v3H12v4h10v3H12v6H9z' fill='white'/%3E%3C/svg%3E">
<title>《崩坏：星穹铁道》系统拆解</title>
<style>${styles}</style></head><body><a class="skip" href="#content">跳转到正文</a><header><span>游戏拆解案</span></header><details class="mobile-navigation"><summary><span class="current-chapter">阅读目录</span><span class="directory-label">目录</span></summary><nav aria-label="移动端作品目录">${links}</nav></details><div class="shell"><aside class="desktop-navigation"><nav aria-label="作品目录">${links}</nav></aside><article id="content" tabindex="-1">${body}</article></div><script>${reader}</script></body></html>`;
await fs.mkdir(path.join(root, 'dist'), { recursive: true });
const assetOutput = path.join(root, 'dist', 'assets');
await fs.mkdir(assetOutput, { recursive: true });
const assetNames = [...new Set([...body.matchAll(/(?:src|srcset|href)="assets\/([\w.-]+)"/g)].map(match => match[1])), '06-share.png'];
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
