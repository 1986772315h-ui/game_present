import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let playwright;
try{playwright=require('playwright')}catch{playwright=require(path.resolve(path.dirname(process.execPath),'../node_modules/playwright'))}
const root=path.dirname(fileURLToPath(import.meta.url));
const target=process.argv[2]||'http://127.0.0.1:8273/';
const output=path.join(root,'qa',process.argv[2]?'taste-published':'taste-local');
await fs.mkdir(output,{recursive:true});
const expected=await fs.readFile(path.join(root,'dist/index.html'),'utf8');
const browser=await playwright.chromium.launch({headless:true,channel:'chrome'});
const results=[],errors=[];
const check=(condition,message)=>{if(!condition)throw new Error(message)};
try{
  for(const [width,height] of [[1440,900],[768,1024],[390,844],[375,812],[320,740],[844,390]]){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
    const response=await page.goto(target,{waitUntil:'networkidle'});
    check(response.status()===200,'HTTP failed');
    check((await response.text()).replace(/\r\n/g,'\n')===expected.replace(/\r\n/g,'\n'),'Served HTML differs from release');
    await page.locator('img').evaluateAll(imgs=>imgs.forEach(i=>i.loading='eager'));
    await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
    await page.evaluate(()=>document.fonts.ready);
    const snapshot=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,images:document.images.length,missingAlt:[...document.images].some(i=>!i.alt),subsections:document.querySelectorAll('article h3[id]').length,chapters:document.querySelectorAll('article h2[id]').length,tables:document.querySelectorAll('table').length,mobileTables:document.querySelectorAll('.mobile-table').length,brokenAnchors:[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash),footer:!!document.querySelector('footer')}));
    check(!snapshot.overflow&&!snapshot.missingAlt&&!snapshot.brokenAnchors.length&&!snapshot.footer,'Layout/semantics failure');
    check(snapshot.subsections===23&&snapshot.chapters===5&&snapshot.tables===7&&snapshot.mobileTables===7&&snapshot.images===7,'Unexpected document structure');
    const text=await page.locator('article').innerText();
    check(!/校准凭证|优化提案|分析系统时，需要/.test(text),'Rejected/procedural text present');
    check(text.includes('体验角色的完整内容')&&text.includes('触发条件倾向')&&text.includes('为输出准备增益效果'),'Author edits lost');
    check(await page.locator('.provenance a').getAttribute('href')==='https://my.feishu.cn/wiki/Q4gawk60ait1SQkkoKicph6InOQ?from=from_copylink','Feishu link changed');
    await page.screenshot({path:path.join(output,`top-${width}.png`)});
    const mobile=width<=900;
    const nav=page.locator(mobile?'.mobile-navigation':'.desktop-navigation');
    if(mobile){
      await nav.locator('summary').click();
      await page.screenshot({path:path.join(output,`directory-${width}.png`)});
      await page.keyboard.press('Escape');
      check(!await nav.evaluate(el=>el.open),'Escape did not close menu');
      check(await nav.locator('summary').evaluate(el=>el===document.activeElement),'Escape did not restore focus');
      await nav.locator('summary').click();
    }else{
      await nav.locator('a[href="#tension"]').click();
    }
    await nav.locator('a[href="#tension-4-2"]').click();
    await page.waitForFunction(()=>document.querySelector('h3#tension-4-2').getBoundingClientRect().top<130);
    check(page.url().endsWith('#tension-4-2'),'Subsection link failed');
    check(await page.locator('#tension-4-2').evaluate(el=>el===document.activeElement),'Heading focus failed');
    check(await nav.locator('a[aria-current="location"]').getAttribute('href')==='#tension-4-2','Active subsection failed');
    check(await page.locator('#tension-4-2').evaluate(el=>el.getBoundingClientRect().top)>=0,'Heading obscured');
    if(mobile)check(!await nav.evaluate(el=>el.open),'Selection did not close menu');
    await page.screenshot({path:path.join(output,`case-${width}.png`)});
    await page.locator('#battle-2-3').evaluate(el=>el.scrollIntoView({block:'start'}));
    await page.waitForFunction(()=>document.querySelector('nav a[aria-current="location"]')?.getAttribute('href')==='#battle-2-3');
    if(mobile)check(await nav.locator('.current-chapter').innerText()==='02 · 战斗决策','Current chapter label failed');
    await page.locator(mobile?'.mobile-table':'.table-wrap').first().scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(output,`table-${width}.png`)});
    await page.locator('img[src="assets/02-decisions.svg"]').screenshot({path:path.join(output,`decisions-${width}.png`)});
    await page.locator('.battle-details').screenshot({path:path.join(output,`battle-details-${width}.png`)});
    await page.locator('.takeaway').first().screenshot({path:path.join(output,`takeaway-${width}.png`)});
    await page.goto(target+'#tension-4-4',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>document.querySelector('nav a[aria-current="location"]')?.getAttribute('href')==='#tension-4-4');
    check(await page.locator('#tension-4-4').evaluate(el=>el.getBoundingClientRect().top>=0),'Deep link obscured');
    results.push({width,height,status:response.status(),...snapshot,navigation:'passed',deepLink:'passed'});
    await page.close();
  }
  const plain=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
  await plain.goto(target);
  await plain.locator('.mobile-navigation summary').click();
  await plain.locator('.mobile-navigation a[href="#conclusion"]').click();
  check(plain.url().endsWith('#conclusion'),'No-JS navigation failed');
  await plain.close();
}finally{await browser.close()}
check(errors.length===0,errors.join('\n'));
await fs.writeFile(path.join(output,'results.json'),JSON.stringify({results,errors},null,2));
console.log(JSON.stringify({viewports:results.length,results,errors},null,2));
