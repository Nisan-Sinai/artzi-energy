import { mkdir, rm, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";
import { join } from "node:path";
import { locales, photos, articleSpecs, guideSpecs } from "../src/data.mjs";

const out = "dist";
const baseUrl = (process.env.SITE_URL || "https://artzi-energy.vercel.app").replace(/\/$/, "");
const esc = value => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const url = (locale, path = "") => "/" + locale + "/" + (path ? path + "/" : "");
const link = (locale, path, label, cls = "") => '<a href="' + url(locale,path) + '" class="' + cls + '">' + label + '</a>';
const btn = (locale, path, label, style = "lime") => link(locale,path,'<span>'+esc(label)+'</span><span aria-hidden="true">↗</span>',"button "+style);
const image = (index, alt = "", lazy = true) => '<img src="'+photos[index % photos.length]+'" alt="'+esc(alt)+'" '+(lazy?'loading="lazy"':'fetchpriority="high"')+' decoding="async">';
const wa = (t, message) => "https://wa.me/972556640524?text=" + encodeURIComponent(message || t.waText);
const words = x => esc(x);
function heading(a,b,description,marker="ARTZI / ENERGY"){
 return '<div class="section-heading"><span class="eyebrow">'+marker+'</span><h2>'+words(a)+'<br><em>'+words(b)+'</em></h2>'+(description?'<p>'+words(description)+'</p>':'')+'</div>';
}
function heroPage(t,a,b,description,imageIndex,eyebrow){
 return '<section class="page-hero"><div class="page-photo">'+image(imageIndex,"",false)+'</div><div class="page-shade"></div><div class="container page-copy"><span class="eyebrow">'+eyebrow+'</span><h1>'+words(a)+'<br><em>'+words(b)+'</em></h1><p>'+words(description)+'</p></div></section>';
}
function cards(t,locale){
 const inds=[0,1,2,3];
 return '<section class="section solutions"><div class="container">'+heading(...t.solutions,t.solDesc,'01 / SOLUTIONS')+
 '<div class="cards">'+inds.map(i=>{const s=t.services[i];return '<a href="'+url(locale,"solutions/"+s[0])+'" class="service-card">'+image(i+1,"")+'<div class="service-content"><span class="eyebrow">0'+(i+1)+' / SOLAR</span><h3>'+words(s[2])+'</h3><p>'+words(s[3])+'</p><span class="service-arrow" aria-hidden="true">↗</span></div></a>';}).join('')+
 '</div></div></section>';
}
function techList(t,locale){
 return '<section class="section technology"><div class="container split"><div>'+heading(...t.technology,t.techDesc,'02 / ENGINEERING')+'<div class="sun-art" aria-hidden="true">☼</div></div><div class="tech-list">'+t.systems.map((x,i)=>link(locale,"technology/"+x[0],'<small>0'+(i+1)+'</small><div><h3>'+words(x[1])+'</h3><p>'+words(x[2])+'</p></div><b aria-hidden="true">↗</b>',"tech-row")).join('')+'</div></div></section>';
}
function solarLab(t,locale){
 return '<section class="section calculator"><div class="container split"><div>'+heading(...t.labTitle,t.labDesc,'03 / THE SOLAR LAB')+'<div class="orbit-art" aria-hidden="true">☼</div></div><div class="lab" data-calculator><div class="lab-top">ARTZI / ROOFTOP LAB <span>● LIVE</span></div><div class="area-label"><label for="roof-area">'+words(t.area)+'</label><output id="roof-display" for="roof-area">150 m²</output></div><input id="roof-area" type="range" min="40" max="1000" step="10" value="150"><div class="tick"><span>40 m²</span><span>1000 m²</span></div><fieldset class="choice"><legend>'+words(t.exposure)+'</legend><label><input type="radio" name="sun-factor" checked value="1"><span>'+words(t.good)+'</span></label><label><input type="radio" name="sun-factor" value=".72"><span>'+words(t.medium)+'</span></label></fieldset><div class="results"><div><small>'+words(t.capacity)+'</small><strong id="capacity-out">25.5 kWp</strong></div><div><small>'+words(t.yearly)+'</small><strong id="production-out">38,250 kWh</strong></div></div><p class="disclaimer">'+words(t.labDisclaimer)+'</p>'+btn(locale,"quote",t.quoteTitle[0]+' '+t.quoteTitle[1])+'</div></div></section>';
}
function scenarioCards(t){
 return '<div class="scenarios">'+t.services.map((s,i)=>'<div class="scenario">'+image(i+1,"")+'<div><span class="eyebrow">'+words(t.projectLabel)+' 0'+(i+1)+'</span><h3>'+words(s[1])+'</h3><p>'+words(s[3])+'</p></div></div>').join('')+'</div>';
}
function articles(t,locale,limit=articleSpecs.length){
 return '<div class="article-grid">'+articleSpecs.slice(0,limit).map((a,i)=>'<a href="'+url(locale,"insights/"+a[0])+'" class="article-card" data-topic="'+a[1]+'" data-search="'+words((a[locale==="he"?2:3]+" "+a[locale==="he"?4:5]).toLowerCase())+'"><div class="article-photo">'+image(i+1,"")+'</div><div class="article-body"><small class="eyebrow">'+words(t.categories[a[1]])+' / 0'+(i+1)+'</small><h3>'+words(a[locale==="he"?2:3])+'</h3><p>'+words(a[locale==="he"?4:5])+'</p><span class="read-more">'+words(t.read)+' ↗</span></div></a>').join('')+'</div>';
}
function guideList(t,locale){
 return '<div class="guide-list">'+guideSpecs.map((g,i)=>link(locale,"guides/"+g[0],'<small>0'+(i+1)+'</small><strong>'+words(g[locale==="he"?1:2])+'</strong><span aria-hidden="true">↗</span>')).join('')+'</div>';
}
function form(t,locale,steps){
 const labels=t.services.map(s=>'<option value="'+s[0]+'">'+words(s[1])+'</option>').join('');
 return '<section class="section inquiry"><div class="container split"><div>'+heading(...t.contactTitle,t.contactDesc,'LET\'S CONNECT')+'<p class="phone"><a dir="ltr" href="tel:+972556640524">+972 55-664-0524</a></p><a href="'+wa(t)+'" class="button outline-dark" target="_blank" rel="noopener noreferrer">'+words(t.whatsapp)+' ↗</a></div><form id="lead-form" data-steps="'+(steps?3:1)+'" novalidate><div class="form-top">ARTZI / INQUIRY <span id="step-counter">01 / '+(steps?'03':'01')+'</span></div><div class="form-stage" data-stage="0"><div class="fields"><label>'+words(t.fullName)+' *<input name="full_name" autocomplete="name" maxlength="120" required></label><label>'+words(t.email)+' *<input name="email" type="email" autocomplete="email" maxlength="180" required></label><label>'+words(t.phone)+'<input name="phone" autocomplete="tel" type="tel" maxlength="30"></label><label>'+words(t.property)+'<select name="property_type">'+labels+'</select></label></div></div><div class="form-stage" data-stage="1" '+(steps?'hidden':'')+'><label>'+words(t.message)+'<textarea name="message" rows="5" maxlength="2500"></textarea></label></div><div class="form-stage" data-stage="2" '+(steps?'hidden':'')+'><label class="consent"><input name="consent" type="checkbox" required><span>'+words(t.consent)+'</span></label><p class="disclaimer">'+words(t.disclosure)+' '+link(locale,"privacy",t.privacyTitle[0]+' '+t.privacyTitle[1])+'</p></div><label class="honeypot" aria-hidden="true">Website<input name="website" autocomplete="off" tabindex="-1"></label><p id="form-feedback" role="status" aria-live="polite"></p><div class="form-actions">'+(steps?'<button type="button" class="button outline-dark" id="prev-step" hidden>'+words(t.previous)+'</button><button type="button" class="button lime" id="next-step">'+words(t.next)+'</button>':'')+'<button type="submit" class="button lime" id="submit-lead" '+(steps?'hidden':'')+'>'+words(t.submit)+' ↗</button></div><a id="send-whatsapp" class="form-wa" href="'+wa(t)+'" target="_blank" rel="noopener noreferrer">'+words(t.whatsapp)+' ↗</a></form></div></section>';
}
function legal(t,locale,kind){
 let sections;
 if(kind==="privacy")sections=locale==="he"?
 [["מידע שנאסף","הטופס מקבל שם מלא, כתובת דוא״ל, טלפון אם נמסר, סוג נכס ותוכן הפנייה. המידע נועד ליצירת קשר בעקבות בקשת הפונה בלבד."],["אחסון ואבטחה","פרטי הפניות נשמרים באמצעות Supabase. הרשאות הגישה לטבלאות מוגבלות באמצעות Row Level Security ונקודת קצה מאומתת בצד השרת."],["הגנה מפני ספאם","ייתכן עיבוד של מזהה טכני נגזר מכתובת הרשת לצורך הגבלת קצב פניות. תמונות וגופנים נטענים גם מספקים חיצוניים."],["בקשות עיון ותיקון","ניתן לפנות למספר +972 55-664-0524 בבקשת עיון, תיקון או מחיקה, בהתאם לדין. פרטי בעל העסק ותקופות שמירה חייבים להיבדק לפני פרסום מסחרי."],["עדכון לפני השקה","זהו טקסט מידע בגרסת Preview. נדרשת בדיקה משפטית ואישור זהות בעל המאגר, פרטי קשר רשמיים ומדיניות מחיקה."]]:
 [["Information collected","Inquiries contain a name, email, optional phone, property type and message, used solely to respond to the request."],["Security and processing","Inquiry data is stored in Supabase. Access is restricted through Row Level Security and server-side validation."],["Anti-abuse checks","A derived technical identifier may be processed to limit excessive submissions. Images and fonts may load from external services."],["Access requests","You may contact +972 55-664-0524 to request access, correction or deletion where required by law."],["Before commercial launch","A legal review must confirm the controller identity, official contact information and retention/deletion policy."]];
 else if(kind==="accessibility")sections=locale==="he"?
 [["נגישות באתר","האתר כולל מבנה סמנטי, ניווט במקלדת, דילוג לתוכן, טקסט חלופי לתמונות, הודעות טופס נגישות והתאמות לצמצום אנימציות."],["התייחסות לתקן","התכנון מתייחס לת״י 5568 ול־WCAG 2.2 AA. זו אינה הצהרת עמידה מלאה או אישור של בדיקת נגישות מקצועית."],["דיווח על בעיה","ניתן לדווח על קושי נגישות במספר +972 55-664-0524. ציינו את כתובת העמוד ואת הפעולה שניסיתם לבצע."]]:
 [["Accessibility features","The site uses semantic structure, keyboard controls, skip navigation, image alternatives, accessible form feedback and reduced-motion support."],["Standards","Designed with Israeli Standard 5568 and WCAG 2.2 AA in mind. This is not a certification of full compliance."],["Report an issue","Call +972 55-664-0524 with the page address and details of the barrier."]];
 else sections=locale==="he"?
 [["מידע כללי","האתר מיועד למידע ראשוני בלבד ואינו מהווה ייעוץ הנדסי, הצעת מחיר או התחייבות לתפוקה."],["תמונות ודוגמאות","התמונות ותרחישי השימוש להמחשה; אין להציגם כפרויקטים שבוצעו בפועל."],["בדיקה מקצועית","לפני התקנת מערכת או החלטה כספית נדרשת בדיקת היתכנות ותכנון מוסמך."]]:
 [["General information","This is an informational preview, not engineering advice, a price quotation or output guarantee."],["Photography and scenarios","Photos and sample scenarios are illustrative and do not document completed company projects."],["Professional review","Installation and financial decisions need qualified assessment."]];
 return '<section class="section legal"><div class="container legal-inner">'+sections.map(s=>'<section><h2>'+words(s[0])+'</h2><p>'+words(s[1])+'</p></section>').join('')+'</div></section>';
}
function page(t,locale,slug){
 if(!slug)return '<section class="hero"><div class="hero-image">'+image(0,"",false)+'</div><div class="hero-overlay"></div><div class="hero-orbit"></div><div class="container hero-inner"><span class="eyebrow">ENGINEERED FOR A BRIGHTER TOMORROW</span><h1><span>'+words(t.hero[0])+'</span><em>'+words(t.hero[1])+'</em><span class="outline-text">'+words(t.hero[2])+'</span></h1><div class="hero-bottom"><p>'+words(t.heroDesc)+'</p><div class="actions">'+btn(locale,"contact",t.contact)+btn(locale,"solutions",t.discover,"glass")+'</div></div><span class="eyebrow">'+words(t.scroll)+' ↓</span></div></section><div class="marquee" aria-hidden="true"><div>'+Array(6).fill('<span>THINK ABOVE</span> ✳ <span>BRIGHTER FUTURE</span> ✳').join('')+'</div></div><section class="section vision"><div class="container split"><div class="vision-photo">'+image(1,"")+'<div class="vision-seal" aria-hidden="true">☼</div></div><div>'+heading(...t.vision,t.visionDesc,'00 / OUR PHILOSOPHY')+btn(locale,"about",t.discover,"dark")+'</div></div></section>'+cards(t,locale)+techList(t,locale)+solarLab(t,locale)+'<section class="section"><div class="container">'+heading(...t.journalTitle,t.journalDesc,'04 / FIELD NOTES')+articles(t,locale,3)+'<div class="center">'+btn(locale,"insights",t.journalTitle[0]+' '+t.journalTitle[1],"dark")+'</div></div></section>';
 if(slug==="about")return heroPage(t,...t.vision,t.visionDesc,1,"VISION / ARTZI")+techList(t,locale);
 if(slug==="solutions")return heroPage(t,...t.solutions,t.solDesc,2,"OUR SOLUTIONS")+cards(t,locale);
 if(slug.startsWith("solutions/")){const x=t.services.find(s=>slug==="solutions/"+s[0]),i=t.services.indexOf(x);return heroPage(t,x[1],x[2],x[3],i+1,"SOLUTION / 0"+(i+1))+'<section class="section"><div class="container split"><div>'+heading(x[1],x[2],x[3],"DESIGNED TO FIT")+btn(locale,"quote",t.contact,"dark")+'</div>'+image(i+1,"")+'</div></section>'+techList(t,locale);}
 if(slug==="technology")return heroPage(t,...t.technology,t.techDesc,3,"TECHNOLOGIES")+techList(t,locale);
 if(slug.startsWith("technology/")){const x=t.systems.find(s=>slug==="technology/"+s[0]),i=t.systems.indexOf(x);return heroPage(t,x[1],x[2],t.techDesc,i+1,"TECH / 0"+(i+1))+'<section class="section"><div class="container split"><div>'+heading(x[1],t.subtitle,x[2],"TECHNOLOGY INSIGHTS")+btn(locale,"contact",t.contact,"dark")+'</div>'+image(i+1,"")+'</div></section>';}
 if(slug==="projects")return heroPage(t,...t.projectTitle,t.projectDesc,2,"ILLUSTRATIVE SCENARIOS")+'<section class="section"><div class="container">'+scenarioCards(t)+'</div></section>';
 if(slug==="gallery")return heroPage(t,...t.gallery,t.galleryDesc,1,"VISUAL INSPIRATION")+'<section class="section"><div class="container"><div class="filters" id="gallery-filters"><button type="button" data-filter="all" aria-pressed="true">ALL</button><button type="button" data-filter="solar" aria-pressed="false">SOLAR</button><button type="button" data-filter="architecture" aria-pressed="false">ARCHITECTURE</button></div><div class="gallery-grid">'+Array.from({length:8},(_,i)=>'<button class="gallery-photo" type="button" data-category="'+(i%2?"architecture":"solar")+'" aria-label="'+words(t.gallery[0])+' '+(i+1)+'">'+image(i,"")+'<span>0'+(i+1)+' / ENERGY</span></button>').join('')+'</div></div></section>';
 if(slug==="process")return heroPage(t,...t.processTitle,t.processDesc,4,"THE PROCESS")+'<section class="section"><div class="container"><div class="steps">'+t.steps.map(x=>'<article><strong>'+x[0]+'</strong><h2>'+words(x[1])+'</h2><p>'+words(x[2])+'</p></article>').join('')+'</div></div></section>';
 if(slug==="calculator")return heroPage(t,...t.labTitle,t.labDesc,3,"ROOFTOP LAB")+solarLab(t,locale);
 if(slug==="compare")return heroPage(t,...t.compTitle,t.compDesc,4,"SOLUTIONS / COMPARE")+'<section class="section"><div class="container"><div class="compare-selects"><label>A<select id="compare-first">'+t.services.map((s,i)=>'<option value="'+i+'">'+words(s[1])+'</option>').join('')+'</select></label><label>B<select id="compare-second">'+t.services.map((s,i)=>'<option value="'+i+'" '+(i===1?'selected':'')+'>'+words(s[1])+'</option>').join('')+'</select></label></div><div class="compare-grid"><article id="compare-a"></article><article id="compare-b"></article></div></div></section>';
 if(slug==="faq")return heroPage(t,...t.faqTitle,t.faqDesc,2,"FAQ")+'<section class="section"><div class="container faq-list">'+t.faq.map((q,i)=>'<details><summary><small>0'+(i+1)+'</small><span>'+words(q[0])+'</span><b aria-hidden="true">+</b></summary><p>'+words(q[1])+'</p></details>').join('')+'</div></section>';
 if(slug==="insights")return heroPage(t,...t.journalTitle,t.journalDesc,1,"THE ENERGY JOURNAL")+'<section class="section"><div class="container"><div class="search-bar"><label>'+words(t.search)+'<input type="search" id="journal-search" placeholder="'+words(t.search)+'"></label><label>'+words(t.filter)+'<select id="journal-filter"><option value="all">'+words(t.all)+'</option>'+t.categories.map((c,i)=>'<option value="'+i+'">'+words(c)+'</option>').join('')+'</select></label></div><p id="journal-count" role="status"></p>'+articles(t,locale)+'<p id="journal-empty" hidden>'+words(t.noResults)+'</p><div class="center">'+btn(locale,"guides",t.guided,"dark")+'</div></div></section>';
 if(slug.startsWith("insights/")){const a=articleSpecs.find(s=>slug==="insights/"+s[0]),i=articleSpecs.indexOf(a),title=a[locale==="he"?2:3],start=locale==="he"?4:5;return heroPage(t,title,t.articleLabel,a[start],i+1,"FIELD NOTES / 0"+(i+1))+'<article class="section article-detail"><div class="container prose">'+link(locale,"insights",words(t.back),"back-link")+'<p class="lead">'+words(a[start])+'</p>'+[0,1,2].map(n=>'<section><h2>'+words(a[start+n*2])+'</h2><p>'+words(a[start+n*2])+'. '+(locale==="he"?'כדאי לאסוף נתוני אתר, לבדוק את הדרישות הרלוונטיות ולבחון פתרון מקצועי שמתאים למבנה ולפעילות בו.':'Collect real site data, confirm applicable requirements and review the solution with qualified professionals who understand the property.')+'</p></section>').join('')+'<p class="disclaimer">'+words(t.preview)+'</p>'+btn(locale,"quote",t.contact,"dark")+'</div></article>';}
 if(slug==="guides")return heroPage(t,...t.guidesTitle,t.guidesDesc,2,"PRACTICAL GUIDES")+'<section class="section"><div class="container">'+guideList(t,locale)+'</div></section>';
 if(slug.startsWith("guides/")){const a=guideSpecs.find(s=>slug==="guides/"+s[0]),title=a[locale==="he"?1:2],start=locale==="he"?3:4;return heroPage(t,title,t.guidesTitle[1],a[start],2,"PRACTICAL GUIDE")+'<section class="section"><div class="container"><div class="steps">'+[0,1,2].map(n=>'<article><strong>0'+(n+1)+'</strong><h2>'+words(a[start+n*2])+'</h2><p>'+(locale==="he"?'נושא זה חשוב לאפיון נכון; יש לבחון אותו בהתאם לתנאי המבנה ולהנחיות בעלי מקצוע.':'This is an important step in planning and should be assessed against actual site conditions with qualified advice.')+'</p></article>').join('')+'</div>'+btn(locale,"quote",t.contact,"dark")+'</div></section>';}
 if(slug==="contact")return heroPage(t,...t.contactTitle,t.contactDesc,2,"LET'S CONNECT")+form(t,locale,false);
 if(slug==="quote")return heroPage(t,...t.quoteTitle,t.quoteDesc,3,"PROJECT DISCOVERY")+form(t,locale,true);
 if(slug==="privacy")return heroPage(t,...t.privacyTitle,t.disclosure,4,"DATA / PRIVACY")+legal(t,locale,"privacy");
 if(slug==="accessibility")return heroPage(t,...t.accessTitle,t.preview,5,"ACCESSIBILITY")+legal(t,locale,"accessibility");
 if(slug==="terms")return heroPage(t,...t.termsTitle,t.preview,5,"TERMS")+legal(t,locale,"terms");
 throw new Error("Unknown route "+slug);
}
export const routes = [
 "", "about", "solutions", "projects", "gallery", "technology", "process", "calculator", "compare", "faq", "insights", "guides", "contact", "quote", "privacy", "accessibility", "terms",
 ...locales.he.services.map(x=>"solutions/"+x[0]),
 ...locales.he.systems.map(x=>"technology/"+x[0]),
 ...articleSpecs.map(x=>"insights/"+x[0]),
 ...guideSpecs.map(x=>"guides/"+x[0])
];
function chrome(locale,route,t,body){
 const home=url(locale);
 const navigation=["","about","solutions","technology","insights","contact"];
 const nav='<header class="header" id="site-header"><div class="container head-inner"><a class="logo" href="'+home+'" aria-label="'+words(t.brand)+'">☼ <span>ARTZI<small>ENERGY</small></span></a><nav class="desktop-nav" aria-label="Main navigation">'+navigation.map((r,i)=>link(locale,r,words(t.nav[i]),r===route?"active":"")).join('')+'</nav><div class="nav-tools">'+link(locale==="he"?"en":"he",route,locale==="he"?"EN":"עב","language")+'<button type="button" class="menu-toggle" aria-expanded="false" aria-controls="mobile-menu" aria-label="Toggle menu"><span></span><span></span></button></div></div><nav id="mobile-menu" class="mobile-menu" hidden>'+[...navigation,"gallery","calculator","faq","quote","privacy","accessibility"].map((r,i)=>link(locale,r,'<small>'+String(i+1).padStart(2,"0")+'</small><span>'+words(t.nav[navigation.indexOf(r)]||r)+'</span><span aria-hidden="true">↗</span>')).join('')+'</nav></header>';
 const footer='<section class="closing"><div class="closing-photo">'+image(4,"")+'</div><div class="container"><span class="eyebrow">THE FUTURE STARTS ABOVE</span><h2>'+words(t.hero[0])+'<br><em>'+words(t.hero[1])+'</em></h2><p>'+words(t.contactDesc)+'</p><div class="actions">'+btn(locale,"contact",t.contact)+ '<a class="button glass" href="'+wa(t)+'" target="_blank" rel="noopener noreferrer">'+words(t.whatsapp)+' ↗</a></div></div></section><footer class="footer"><div class="container foot-grid"><div><a href="'+home+'" class="foot-logo">☼ ARTZI<small>ENERGY</small></a><p>'+words(t.line)+'</p></div><nav aria-label="Footer navigation">'+["about","solutions","technology","projects","gallery","process","insights","guides","faq","calculator","compare","contact","quote","privacy","accessibility","terms"].map(r=>link(locale,r,words(r.toUpperCase()))).join('')+'</nav><div class="foot-contact"><span class="eyebrow">LET\'S CONNECT</span><a href="tel:+972556640524" dir="ltr">+972 55-664-0524</a><a href="'+wa(t)+'" target="_blank" rel="noopener noreferrer">'+words(t.whatsapp)+' ↗</a><button id="install-app" hidden type="button">'+words(t.install)+'</button></div></div><div class="container foot-last">© 2026 ARTZI ENERGY <span>'+words(t.preview)+'</span></div></footer>';
 const name=route?"ARTZI | "+route.replaceAll("/"," / "):t.brand;
 const completeTitle=words(name),desc=words(route.startsWith("insights")?t.journalDesc:t.heroDesc);
 const canonical=baseUrl+url(locale,route);
 return '<!doctype html><html lang="'+locale+'" dir="'+t.dir+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#071c16"><meta name="description" content="'+desc+'"><meta name="robots" content="noindex,nofollow"><meta property="og:type" content="website"><meta property="og:title" content="'+completeTitle+'"><meta property="og:description" content="'+desc+'"><meta property="og:image" content="'+photos[0]+'"><link rel="canonical" href="'+canonical+'"><link rel="alternate" hreflang="he-IL" href="'+baseUrl+url("he",route)+'"><link rel="alternate" hreflang="en" href="'+baseUrl+url("en",route)+'"><link rel="alternate" hreflang="x-default" href="'+baseUrl+url("he",route)+'"><link rel="preconnect" href="https://images.unsplash.com"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="manifest" href="/manifest.webmanifest"><link rel="stylesheet" href="/styles.css"><title>'+completeTitle+'</title></head><body><a href="#main" class="skip">'+words(t.skip)+'</a><div class="progress" id="progress"></div>'+nav+'<main id="main">'+body+'</main>'+footer+'<a class="floating-whatsapp" href="'+wa(t)+'" target="_blank" rel="noopener noreferrer" aria-label="'+words(t.whatsapp)+'">WA</a><script src="/app.js" defer></script></body></html>';
}
function crc32(buffer){
 let crc = 0xffffffff;
 for (const byte of buffer){ crc ^= byte; for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0); }
 return (crc^0xffffffff)>>>0;
}
function pngChunk(name,data){
 const type=Buffer.from(name);const len=Buffer.alloc(4);len.writeUInt32BE(data.length);
 const sum=Buffer.alloc(4);sum.writeUInt32BE(crc32(Buffer.concat([type,data])));
 return Buffer.concat([len,type,data,sum]);
}
function iconPng(size){
 const raw=Buffer.alloc(size*(1+size*4));
 for(let y=0;y<size;y++){
  let base=y*(1+size*4);
  for(let x=0;x<size;x++){
   const dx=x-size/2,dy=y-size/2,dist=Math.hypot(dx,dy);
   const angle=Math.atan2(dy,dx),sector=Math.round(angle/(Math.PI/4)),gap=Math.abs(angle-sector*Math.PI/4);
   const bright=(dist>size*.18&&dist<size*.22)||(dist>size*.3&&dist<size*.42&&gap<.085);
   const i=base+1+x*4;raw[i]=bright?220:7;raw[i+1]=bright?252:28;raw[i+2]=bright?108:22;raw[i+3]=255;
  }
 }
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),pngChunk("IHDR",ihdr),pngChunk("IDAT",deflateSync(raw)),pngChunk("IEND",Buffer.alloc(0))]);
}
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
const write = async (name,data) => {const full=join(out,name);await mkdir(join(full,".."),{recursive:true});await writeFile(full,data);};
const allLinks=[];
for(const locale of ["he","en"]) {
 for(const route of routes) {
  const title=locale==="he"?"ארצי אנרגיה":"Artzi Energy";
  const doc=chrome(locale,route,locales[locale],page(locales[locale],locale,route));
  await write(locale+"/"+(route?route+"/":"")+"index.html",doc);
  allLinks.push(url(locale,route));
 }
}
await write("index.html",'<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/he/"><title>ארצי אנרגיה</title></head><body><a href="/he/">ארצי אנרגיה</a></body></html>');
await write("styles.css",(await import("node:fs/promises")).readFile("src/styles.css","utf8"));
await write("app.js",(await import("node:fs/promises")).readFile("src/app.js","utf8"));
await write("favicon.svg",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="35" fill="#071c16"/><circle cx="96" cy="96" r="34" stroke="#dcfc6c" stroke-width="8" fill="none"/><path d="M96 17v31m0 96v31M17 96h31m96 0h31M40 40l22 22m68 68 22 22m0-112-22 22M62 130l-22 22" stroke="#dcfc6c" stroke-width="8" stroke-linecap="round"/></svg>');
await write("icon-192.png",iconPng(192));
await write("icon-512.png",iconPng(512));
await write("manifest.webmanifest",JSON.stringify({name:"Artzi Energy — ארצי אנרגיה",short_name:"Artzi Energy",start_url:"/he/",scope:"/",display:"standalone",background_color:"#071c16",theme_color:"#071c16",icons:[{src:"/icon-192.png",sizes:"192x192",type:"image/png",purpose:"any maskable"},{src:"/icon-512.png",sizes:"512x512",type:"image/png",purpose:"any maskable"}]}));
await write("robots.txt","User-agent: *\nDisallow: /\nSitemap: "+baseUrl+"/sitemap.xml\n");
await write("sitemap.xml",'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+allLinks.map(x=>'<url><loc>'+baseUrl+x+'</loc></url>').join('')+'</urlset>');
await write("sw.js",'const CACHE="artzi-preview-v1";const urls=["/","/he/","/en/","/styles.css","/app.js"];self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(urls)));self.skipWaiting()});self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});self.addEventListener("fetch",e=>{if(e.request.method!=="GET"||new URL(e.request.url).origin!==location.origin)return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{})}return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match("/he/"))))})');
console.log(JSON.stringify({routesPerLocale:routes.length,totalHtml:allLinks.length,assets:7}));
