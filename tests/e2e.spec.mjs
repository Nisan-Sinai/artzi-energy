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
  await page.locator("#roof-area").fill("500");
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
  await expect(page.locator("article.prose")).toBeVisible();
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
