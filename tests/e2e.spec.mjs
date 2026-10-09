import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { routes } from "../scripts/build.mjs";
test("all bilingual routes serve HTML, have a title and working locale links",async({page})=>{
  for(const locale of ["he","en"]){
    for(const route of routes){
      const path="/"+locale+"/"+(route?route+"/":"");
      const res=await page.goto(path,{waitUntil:"domcontentloaded"});
      expect(res?.status(),path).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
      expect(await page.title()).not.toContain("undefined");
      expect(await page.locator("html").getAttribute("lang")).toBe(locale);
      const opposite=locale==="he"?"en":"he";
      expect(await page.locator("a.language").getAttribute("href")).toBe("/"+opposite+"/"+(route?route+"/":""));
    }
  }
});
test("mobile layouts have no horizontal overflow",async({page})=>{
  const paths=["/he/","/en/","/he/solutions/","/he/insights/","/he/quote/","/he/calculator/","/he/gallery/"];
  for(const width of [320,375,390,768,1024,1440]){
    await page.setViewportSize({width,height:900});
    for(const path of paths){
      await page.goto(path,{waitUntil:"domcontentloaded"});
      await page.evaluate(()=>document.fonts.ready);
      const overflow=await page.evaluate(()=>{
        const viewport=document.documentElement.clientWidth;
        const offenders=[...document.body.querySelectorAll("*")].filter(el=>{
          const rect=el.getBoundingClientRect();
          const css=getComputedStyle(el);
          if(css.position==="fixed"||css.position==="absolute"||css.overflowX==="hidden"||css.overflowX==="clip")return false;
          return rect.width>0 && (rect.right>viewport+2 || rect.left< -2);
        }).slice(0,8).map(el=>({tag:el.tagName,className:el.className?.toString?.().slice(0,80)}));
        return {viewport,scroll:document.documentElement.scrollWidth,offenders};
      });
      expect(overflow.scroll,path+" / "+width+" / "+JSON.stringify(overflow.offenders)).toBeLessThanOrEqual(overflow.viewport+2);
    }
  }
});
test("calculator updates immediately with roof area and exposure",async({page})=>{
  await page.goto("/he/calculator/");
  const initial=await page.locator("#production-out").textContent();
  await page.locator("#roof-area").evaluate(el=>{el.value="500";el.dispatchEvent(new Event("input",{bubbles:true}))});
  const larger=await page.locator("#production-out").textContent();
  expect(larger).not.toBe(initial);
  await page.locator('input[value=".72"]').check({force:true});
  const medium=await page.locator("#production-out").textContent();
  expect(medium).not.toBe(larger);
});
test("journal filtering and article navigation work",async({page})=>{
  await page.goto("/he/insights/");
  await expect(page.locator(".article-card")).toHaveCount(20);
  await page.locator("#journal-search").fill("ממירים");
  await expect(page.locator(".article-card:visible")).toHaveCount(1);
  await page.locator(".article-card:visible").first().click();
  await expect(page.locator(".article-detail .prose")).toBeVisible();
});
test("quote flow validates required fields without sending an invalid lead",async({page})=>{
  await page.goto("/he/quote/");
  await page.locator("#next-step").click();
  await expect(page.locator("#form-feedback")).not.toBeEmpty();
  await page.locator('input[name="full_name"]').fill("ישראל ישראלי");
  await page.locator('input[name="email"]').fill("test@example.com");
  await page.locator("#next-step").click();
  await expect(page.locator('.form-stage[data-stage="1"]')).toBeVisible();
  await page.locator("#next-step").click();
  await page.locator("#submit-lead").click();
  await expect(page.locator("#form-feedback")).not.toBeEmpty();
});
test("accessibility audit on both language homepages",async({page})=>{
  for(const locale of ["he","en"]){
    await page.goto("/"+locale+"/");
    const results=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
    expect(results.violations.map(v=>v.id+" "+v.nodes.map(n=>n.target.join(",")).join(" | "))).toEqual([]);
  }
});


test("all generated routes stay within a 320 px viewport without horizontal document overflow",async({page})=>{
  await page.setViewportSize({width:320,height:760});
  for(const locale of ["he","en"]){
    for(const route of routes){
      const url="/"+locale+"/"+(route?route+"/":"");
      await page.goto(url,{waitUntil:"domcontentloaded"});
      const {scrollWidth,clientWidth}=await page.evaluate(()=>({
        scrollWidth:document.documentElement.scrollWidth,
        clientWidth:document.documentElement.clientWidth
      }));
      expect(scrollWidth,url+" at 320px").toBeLessThanOrEqual(clientWidth+2);
    }
  }
});
test("all page images on primary homepages load, and no JavaScript errors are thrown",async({page})=>{
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  for(const locale of ["he","en"]){
    await page.goto("/"+locale+"/",{waitUntil:"domcontentloaded"});
    const images=page.locator("img");
    const count=await images.count();
    for(let i=0;i<count;i++){
      await images.nth(i).scrollIntoViewIfNeeded();
      await images.nth(i).evaluate(img=>img.decode().catch(()=>{}));
      const data=await images.nth(i).evaluate(img=>({complete:img.complete,width:img.naturalWidth,src:img.src}));
      expect(data.width,data.src).toBeGreaterThan(0);
    }
  }
  expect(errors).toEqual([]);
});
test("automated accessibility on distinct public page templates in both locales",async({page})=>{
  const templates=["about","solutions","projects","gallery","technology","process","calculator","compare","faq","insights","guides","contact","quote","privacy","accessibility","terms","solutions/residential","technology/modules","insights/roof-readiness","guides/start"];
  const errors=[];
  for(const locale of ["he","en"]){
    for(const route of templates){
      await page.goto("/"+locale+"/"+route+"/",{waitUntil:"domcontentloaded"});
      const results=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
      for(const v of results.violations)errors.push(locale+"/"+route+" — "+v.id+": "+v.nodes.map(n=>n.target.join(" ")).join("; "));
    }
  }
  expect(errors).toEqual([]);
});
