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
  const found=await page.locator(".article-card:visible").count();
  expect(found).toBeGreaterThan(0);
  expect(found).toBeLessThan(20);
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


test("valid multistep lead is validated, serialized and confirms backend success",async({page})=>{
  let payload=null;
  await page.route("https://edalkjxbodxyyhsomnlt.supabase.co/functions/v1/submit-contact",async route=>{
    payload=JSON.parse(route.request().postData()||"{}");
    await route.fulfill({status:201,contentType:"application/json",headers:{"Access-Control-Allow-Origin":"*"},body:JSON.stringify({ok:true})});
  });
  await page.goto("/he/quote/");
  await page.locator('input[name="full_name"]').fill("בדיקה אוטומטית");
  await page.locator('input[name="email"]').fill("qa@example.com");
  await page.locator('select[name="property_type"]').selectOption("operations");
  await page.locator("#next-step").click();
  await page.locator('textarea[name="message"]').fill("This is a browser test using a mocked API response");
  await page.locator("#next-step").click();
  await page.locator('input[name="consent"]').check();
  await page.locator("#submit-lead").click();
  await expect(page.locator("#form-feedback")).toContainText("הפנייה נשמרה בהצלחה");
  expect(payload?.property_type).toBe("maintenance");
  expect(payload?.consent).toBe(true);
  expect(payload?.full_name).toBe("בדיקה אוטומטית");
});


test("PWA manifest, icons and service worker register successfully",async({page,request})=>{
  const manifestResponse=await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest=await manifestResponse.json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.map(i=>i.sizes)).toContain("192x192");
  expect(manifest.icons.map(i=>i.sizes)).toContain("512x512");
  for(const image of manifest.icons){
    const res=await request.get(image.src);
    expect(res.status(),image.src).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  }
  await page.goto("/he/",{waitUntil:"load"});
  const registered=await page.evaluate(async()=>{
    if(!("serviceWorker" in navigator))return false;
    await navigator.serviceWorker.ready;
    return navigator.serviceWorker.getRegistrations().then(r=>r.some(x=>x.active?.scriptURL.endsWith("/sw.js")));
  });
  expect(registered).toBeTruthy();
});


test("journal search checks full articles and synchronizes a shareable URL",async({page})=>{
 await page.goto("/he/insights/");
 await expect(page.locator(".article-card")).toHaveCount(20);
 await page.locator("#journal-search").fill("שלד");
 const shown=await page.locator(".article-card:visible").count();
 expect(shown).toBeGreaterThan(0);
 expect(shown).toBeLessThan(20);
 expect(new URL(page.url()).searchParams.get("q")).toBe("שלד");
 await page.reload();
 await expect(page.locator("#journal-search")).toHaveValue("שלד");
 await expect(page.locator(".article-card:visible")).toHaveCount(shown);
});
test("journal categories, empty state, reset and browser back filter persistence",async({page})=>{
 await page.goto("/en/insights/");
 await page.locator("#journal-filter").selectOption("1");
 const filtered=await page.locator(".article-card:visible").count();
 expect(filtered).toBeGreaterThan(0);
 expect(filtered).toBeLessThan(20);
 expect(new URL(page.url()).searchParams.get("topic")).toBe("1");
 await page.locator("#journal-search").fill("UNFINDABLEMAGAZINE12345");
 await expect(page.locator("#journal-empty")).toBeVisible();
 await expect(page.locator(".article-card:visible")).toHaveCount(0);
 await page.locator("#journal-reset").click();
 await expect(page.locator(".article-card:visible")).toHaveCount(20);
 await expect(page.locator("#journal-reset")).toBeHidden();
 expect(new URL(page.url()).searchParams.has("topic")).toBe(false);
 await page.locator("#journal-search").fill("inverter");
 await page.locator(".article-card:visible").first().click();
 await page.locator(".breadcrumbs a[href*='/insights/']").click();
 await expect(page.locator("#journal-search")).toHaveValue("inverter");
});
test("all articles have unique titles, original content, working TOC and related recommendations",async({page})=>{
 const headings=[];
 for(const locale of ["he","en"]){
  for(const slug of ["roof-readiness","module-choice","inverters","future-of-solar"]){
   await page.goto("/"+locale+"/insights/"+slug+"/");
   const title=await page.title();
   expect(title).not.toContain("ARTZI | insights");
   headings.push(locale+title);
   await expect(page.locator(".article-section")).toHaveCount(3);
   await expect(page.locator(".article-toc a")).toHaveCount(3);
   await expect(page.locator(".related-card")).toHaveCount(3);
   const first=await page.locator(".article-section p").first().textContent();
   expect(first.length).toBeGreaterThan(100);
   await page.locator('.article-toc a[href="#section-2"]').click();
   expect(new URL(page.url()).hash).toBe("#section-2");
   await expect(page.locator(".article-share .share-article")).toBeVisible();
  }
 }
 expect(new Set(headings).size).toBe(headings.length);
});
test("article share action generates feedback and all bilingual practical guide steps have original body",async({page})=>{
 await page.goto("/he/insights/roof-readiness/");
 await page.locator(".share-article").click();
 await expect(page.locator("#share-feedback")).not.toBeEmpty();
 for(const locale of ["he","en"]){
  await page.goto("/"+locale+"/guides/start/");
  await expect(page.locator(".guide-steps article")).toHaveCount(3);
  for(let n=0;n<3;n++)expect((await page.locator(".guide-steps article p").nth(n).textContent()).length).toBeGreaterThan(35);
 }
});


test("premium home showcases cinematic hero, editorial story and solar studio in both languages",async({page})=>{
 for(const locale of ["he","en"]){
  await page.goto("/"+locale+"/");
  await expect(page.locator("section.cinematic-home h1")).toBeVisible();
  await expect(page.locator(".studio-intro h2")).toBeVisible();
  await expect(page.locator(".solar-story h2")).toBeVisible();
  await expect(page.locator(".rooftop-studio h2")).toBeVisible();
  await expect(page.locator(".journal-feature h2")).toBeVisible();
  await expect(page.locator(".studio-value")).toHaveCount(3);
  await expect(page.locator(".roofstudio-tab")).toHaveCount(4);
  await expect(page.locator(".journal-small .article-card")).toHaveCount(3);
  expect(await page.locator(".header-cta").getAttribute("href")).toBe("/"+locale+"/quote/");
 }
});
test("solar atelier phase controls update content and support keyboard navigation",async({page})=>{
 await page.goto("/he/");
 const tabs=page.locator('.roofstudio-tab[role="tab"]');
 await expect(page.locator("#roofstudio-phase")).toHaveText("01 / 04");
 const before=await page.locator("#phase-description").textContent();
 await tabs.nth(2).click();
 await expect(page.locator("#roofstudio-phase")).toHaveText("03 / 04");
 await expect(tabs.nth(2)).toHaveAttribute("aria-selected","true");
 expect(await page.locator("#phase-description").textContent()).not.toBe(before);
 await tabs.nth(2).focus();
 await page.keyboard.press("ArrowRight");
 await expect(page.locator("#roofstudio-phase")).toHaveText("04 / 04");
 await expect(tabs.nth(3)).toBeFocused();
 await page.keyboard.press("Home");
 await expect(page.locator("#roofstudio-phase")).toHaveText("01 / 04");
});
test("solar atelier has no document overflow on typical phone widths and accessible home landmarks",async({page})=>{
 for(const width of [320,375,390,430,768,1024,1440]){
  await page.setViewportSize({width,height:844});
  for(const locale of ["he","en"]){
   await page.goto("/"+locale+"/");
   const bounds=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
   expect(bounds.doc,"Home overflow "+width+" "+locale).toBeLessThanOrEqual(bounds.viewport+2);
   await expect(page.locator("main")).toHaveCount(1);
   await expect(page.locator("h1")).toHaveCount(1);
  }
 }
});


test("solar motion film actually animates, pauses, replays and closes accessibly",async({page})=>{
 for(const lang of ["he","en"]){
  await page.goto("/"+lang+"/");
  const preview=page.locator("#open-solar-film");
  const dialog=page.locator("#solar-film-dialog");
  const film=page.locator("#solar-film-canvas");
  const toggle=page.locator("#solar-film-toggle");
  await expect(preview).toBeVisible();
  await expect(dialog).not.toBeVisible();
  await preview.click();
  await expect(dialog).toBeVisible();
  await expect(page.locator("#close-solar-film")).toBeFocused();
  await expect(film).toHaveAttribute("data-play-state","playing");
  const first=await film.getAttribute("data-frame");
  await expect.poll(async()=>film.getAttribute("data-frame"),{timeout:5000}).not.toBe(first);
  const frameA=await film.evaluate(canvas=>canvas.toDataURL("image/png"));
  await page.waitForTimeout(250);
  const frameB=await film.evaluate(canvas=>canvas.toDataURL("image/png"));
  expect(frameB).not.toBe(frameA);
  await toggle.click();
  await expect(film).toHaveAttribute("data-play-state","paused");
  await expect(toggle).toHaveAttribute("aria-pressed","false");
  const frozen=await film.evaluate(canvas=>canvas.toDataURL("image/png"));
  await page.waitForTimeout(250);
  expect(await film.evaluate(canvas=>canvas.toDataURL("image/png"))).toBe(frozen);
  await page.locator("#solar-film-replay").click();
  await expect(film).toHaveAttribute("data-play-state","playing");
  await expect(page.locator("#solar-film-time")).toContainText("00:00");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(preview).toBeFocused();
  await expect(film).toHaveAttribute("data-play-state","paused");
  await preview.click();
  await expect(dialog).toBeVisible();
  await page.locator("#close-solar-film").click();
  await expect(dialog).not.toBeVisible();
 }
});
test("solar film section stays responsive and clearly labels the original animation",async({page})=>{
 for(const width of [320,375,390,768,1024,1440]){
  await page.setViewportSize({width,height:850});
  await page.goto("/he/");
  const box=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
  expect(box.scroll,"Video showcase overflow at "+width+"px").toBeLessThanOrEqual(box.viewport+2);
  await expect(page.locator(".film-disclaimer")).toContainText("אנימציה מקורית להמחשה");
 }
});


test("solar film has no remote media dependency and is delivered as a local asset",async({page,request})=>{
 const script=await request.get("/solar-film.js");
 expect(script.ok()).toBeTruthy();
 expect(await script.text()).toContain("function draw(t)");
 await page.goto("/he/");
 const mediaRequests=[];
 page.on("request",r=>{
   if(/upload\.wikimedia\.org|videos\.pexels\.com|\.webm(\?|$)|\.mp4(\?|$)/i.test(r.url()))mediaRequests.push(r.url());
 });
 await page.locator("#open-solar-film").click();
 await expect(page.locator("#solar-film-canvas")).toHaveAttribute("data-play-state","playing");
 await page.waitForTimeout(350);
 expect(mediaRequests).toEqual([]);
});
