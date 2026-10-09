(() => {
  "use strict";
  const lang = document.documentElement.lang === "en" ? "en" : "he";
  const labels = {
    he:{invalid:"יש להזין שם מלא, דוא״ל תקין ולהסכים לשמירת פרטי הפנייה.",ok:"הפנייה נשמרה בהצלחה.",failed:"לא הצלחנו לשלוח. אפשר ליצור קשר בוואטסאפ.",loading:"שולח..."},
    en:{invalid:"Enter a full name, a valid email and consent.",ok:"Your inquiry was received.",failed:"Submission failed. Please contact us on WhatsApp.",loading:"Sending..."}
  }[lang];
  const api = "https://edalkjxbodxyyhsomnlt.supabase.co/functions/v1/submit-contact";
  const header = document.getElementById("site-header");
  const progress = document.getElementById("progress");
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  function onScroll(){
    header?.classList.toggle("scrolled", window.scrollY > 25);
    if(progress)progress.style.width = Math.min(100,100*window.scrollY/Math.max(1,document.documentElement.scrollHeight-window.innerHeight))+"%";
  }
  window.addEventListener("scroll",onScroll,{passive:true});onScroll();
  menuToggle?.addEventListener("click",()=>{
    const open=menuToggle.getAttribute("aria-expanded")!=="true";
    menuToggle.setAttribute("aria-expanded",String(open));
    mobileMenu.hidden=!open;
    header.classList.toggle("menu-open",open);
  });
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape" && mobileMenu && !mobileMenu.hidden){
      mobileMenu.hidden=true;header.classList.remove("menu-open");
      menuToggle.setAttribute("aria-expanded","false");menuToggle.focus();
    }
  });
  document.querySelectorAll("a.language").forEach(link=>link.addEventListener("click",()=>{
    try{localStorage.setItem("artzi-lang",lang==="he"?"en":"he")}catch{}
  }));
  const calc=document.querySelector("[data-calculator]");
  if(calc){
    const range=calc.querySelector("#roof-area");
    const formatter=new Intl.NumberFormat(lang==="he"?"he-IL":"en-US");
    const render=()=>{
      const square=Number(range.value);
      const factor=Number(calc.querySelector('input[name="sun-factor"]:checked').value);
      calc.querySelector("#roof-display").textContent=formatter.format(square)+" m²";
      calc.querySelector("#capacity-out").textContent=(square*.17).toFixed(1)+" kWp";
      calc.querySelector("#production-out").textContent=formatter.format(Math.round(square*.17*1500*factor))+" kWh";
    };
    range.addEventListener("input",render);
    calc.querySelectorAll('input[name="sun-factor"]').forEach(el=>el.addEventListener("change",render));
    render();
  }
  const search=document.getElementById("journal-search");
  const category=document.getElementById("journal-filter");
  if(search && category){
    const cards=[...document.querySelectorAll(".article-card")];
    const count=document.getElementById("journal-count");
    const empty=document.getElementById("journal-empty");
    const update=()=>{
      const term=search.value.trim().toLocaleLowerCase();
      let visible=0;
      for(const card of cards){
        const matches=(!term||card.dataset.search.includes(term)) && (category.value==="all"||card.dataset.topic===category.value);
        card.hidden=!matches;
        if(matches)visible++;
      }
      count.textContent=visible+" "+(lang==="he"?"מאמרים":"articles");
      empty.hidden=visible!==0;
    };
    search.addEventListener("input",update);
    category.addEventListener("change",update);
    update();
  }
  const galleryButtons=[...document.querySelectorAll("#gallery-filters button")];
  for(const button of galleryButtons){
    button.addEventListener("click",()=>{
      galleryButtons.forEach(b=>b.setAttribute("aria-pressed",String(b===button)));
      document.querySelectorAll(".gallery-photo").forEach(tile=>tile.hidden=button.dataset.filter!=="all"&&tile.dataset.category!==button.dataset.filter);
    });
  }
  document.querySelectorAll(".gallery-photo").forEach(tile=>tile.addEventListener("click",()=>{
    const modal=document.createElement("dialog");
    modal.style.cssText="background:#071d16;color:white;border:0;border-radius:15px;padding:17px;max-width:min(940px,94vw)";
    const close=document.createElement("button");
    close.type="button";close.textContent=lang==="he"?"סגירה":"Close";
    close.style.cssText="padding:9px 16px;background:#dcfc6c;border:0;border-radius:30px;margin:0 0 12px";
    const img=tile.querySelector("img").cloneNode();
    img.style.cssText="max-height:80vh;width:auto;object-fit:contain";
    modal.append(close,img);
    document.body.appendChild(modal);
    close.addEventListener("click",()=>modal.close());
    modal.addEventListener("click",event=>{if(event.target===modal)modal.close()});
    modal.addEventListener("close",()=>modal.remove());
    modal.showModal();close.focus();
  }));
  const compareFirst=document.getElementById("compare-first");
  const compareSecond=document.getElementById("compare-second");
  if(compareFirst && compareSecond){
    const options={
      he:[
        ["גגות פרטיים","התאמה לבית מגורים, הצללה, שטח, צריכה ותשתיות."],
        ["מסחר ותעשייה","אופי הפעילות, מערכות גג קיימות, בטיחות וגישה."],
        ["מבנים חקלאיים","תנאי לחות ואבק, אופי המבנה, פעילות ושימושים."],
        ["תחזוקה ושיפור","מצב ציוד, ניטור נתוני יצור, בדיקות ובטיחות."]
      ],
      en:[
        ["Residential","Home structure, shade, usable area, usage and grid infrastructure."],
        ["Commercial & industrial","Site operations, existing rooftop equipment, safety and access."],
        ["Agriculture","Humidity, dust, structure, working conditions and access."],
        ["Monitoring & upgrades","Component condition, production data, inspection and safety."]
      ]
    }[lang];
    const render=()=>{
      [[compareFirst,"compare-a"],[compareSecond,"compare-b"]].forEach(([select,id])=>{
        const data=options[Number(select.value)],box=document.getElementById(id);
        box.replaceChildren();
        const h=document.createElement("h2");h.textContent=data[0];
        const p=document.createElement("p");p.textContent=data[1];
        box.append(h,p);
      });
    };
    compareFirst.addEventListener("change",render);
    compareSecond.addEventListener("change",render);render();
  }
  const form=document.getElementById("lead-form");
  if(form){
    const isMultistep=form.dataset.steps==="3";
    const stages=[...form.querySelectorAll(".form-stage")];
    const previous=document.getElementById("prev-step");
    const next=document.getElementById("next-step");
    const submit=document.getElementById("submit-lead");
    const feedback=document.getElementById("form-feedback");
    const sendWhatsApp=document.getElementById("send-whatsapp");
    let step=0;
    function show(){
      for(let i=0;i<stages.length;i++)stages[i].hidden=isMultistep?i!==step:false;
      if(isMultistep){
        previous.hidden=step===0;next.hidden=step===2;submit.hidden=step!==2;
        document.getElementById("step-counter").textContent="0"+(step+1)+" / 03";
      }
    }
    function validBasic(){
      const data=new FormData(form);
      const name=String(data.get("full_name")||"").trim();
      const email=String(data.get("email")||"").trim();
      return name.length>=2 && name.length<=120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length<=180;
    }
    function updateWhatsApp(){
      const data=new FormData(form);
      const greeting=lang==="he"?"שלום ארצי אנרגיה, אשמח לקבל פרטים על פתרון סולארי.":"Hello Artzi Energy, I would like to learn about solar solutions.";
      const values=[greeting,String(data.get("full_name")||""),String(data.get("email")||""),String(data.get("phone")||""),String(data.get("property_type")||""),String(data.get("message")||"")];
      sendWhatsApp.href="https://wa.me/972556640524?text="+encodeURIComponent(values.filter(Boolean).join("\n"));
    }
    next?.addEventListener("click",()=>{
      if(step===0 && !validBasic()){feedback.textContent=labels.invalid;return}
      feedback.textContent="";step=Math.min(2,step+1);show();
    });
    previous?.addEventListener("click",()=>{step=Math.max(0,step-1);show()});
    form.addEventListener("input",updateWhatsApp);
    form.addEventListener("change",updateWhatsApp);
    form.addEventListener("submit",async event=>{
      event.preventDefault();
      const fields=new FormData(form);
      if(!validBasic()||!fields.has("consent")){feedback.textContent=labels.invalid;return}
      submit.disabled=true;feedback.textContent=labels.loading;
      try{
        const response=await fetch(api,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
          full_name:String(fields.get("full_name")||"").trim(),email:String(fields.get("email")||"").trim(),
          phone:String(fields.get("phone")||"").trim(),
          property_type:String(fields.get("property_type")||"residential"),
          message:String(fields.get("message")||""),locale:lang,consent:true,
          website:String(fields.get("website")||"")
        })});
        if(!response.ok)throw Error("server");
        feedback.textContent=labels.ok;form.reset();step=0;show();updateWhatsApp();
      }catch{feedback.textContent=labels.failed}finally{submit.disabled=false}
    });
    show();updateWhatsApp();
  }
  if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));
  let deferredPrompt=null;
  const install=document.getElementById("install-app");
  window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();deferredPrompt=event;if(install)install.hidden=false});
  install?.addEventListener("click",()=>{if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null;install.hidden=true}});
})();
