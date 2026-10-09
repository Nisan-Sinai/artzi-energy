import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { locales, articleSpecs, guideSpecs } from "../src/data.mjs";
import { routes } from "../scripts/build.mjs";
test("50+ distinct routes per locale",()=>{
  assert.ok(routes.length>=50,"at least 50 real routes");
  assert.equal(new Set(routes).size,routes.length,"unique route paths");
  assert.equal(articleSpecs.length,20);
  assert.equal(guideSpecs.length,8);
});
test("all routes build into a unique HTML file, in both languages",async()=>{
  for(const locale of ["he","en"]){
    for(const route of routes){
      const file=join("dist",locale,...(route?route.split("/"):[]),"index.html");
      const page=await readFile(file,"utf8");
      assert.match(page,/<!doctype html>/i,file);
      assert.ok(page.length>1000,file);
      assert.ok(page.includes('lang="'+locale+'"'),file);
      assert.ok(page.includes('dir="'+locales[locale].dir+'"'),file);
      assert.ok(!page.includes(">undefined<"),file);
      assert.ok(page.includes('hreflang="he-IL"'),file);
      assert.ok(page.includes('hreflang="en"'),file);
      assert.ok(page.includes('href="/'+locale+'/'),file);
      assert.ok(page.includes('href="https:\/\/wa.me\/972556640524'),file);
      assert.match(page,/<main id="main">/,file);
      assert.match(page,/<\/main>/,file);
    }
  }
});
test("every internal route link points to an existing page",async()=>{
  for(const locale of ["he","en"]){
    for(const route of routes){
      const file=join("dist",locale,...(route?route.split("/"):[]),"index.html");
      const content=await readFile(file,"utf8");
      const urls=[...content.matchAll(/href="(\/(?:he|en)\/[^"]*)"/g)].map(m=>m[1]);
      for(const path of urls){
        const relative=decodeURI(path).replace(/^\//,"").split("/").filter(Boolean);
        const target=join("dist",...relative,"index.html");
        await stat(target).catch(()=>{throw Error(file+" broken link: "+path)});
      }
    }
  }
});
test("static assets and PWA icons are emitted",async()=>{
  for(const path of ["styles.css","app.js","icon-192.png","icon-512.png","favicon.svg","manifest.webmanifest","robots.txt","sitemap.xml","sw.js"]){
    const meta=await stat(join("dist",path));
    assert.ok(meta.size>10,path);
  }
});
test("translated navigation, contact and privacy notices exist",()=>{
  for(const locale of ["he","en"]){
    const t=locales[locale];
    assert.equal(t.nav.length,6);
    assert.equal(t.services.length,4);
    assert.equal(t.systems.length,5);
    assert.equal(t.steps.length,4);
    assert.ok(t.privacyTitle.length===2);
    assert.ok(t.consent.length>35);
  }
});
