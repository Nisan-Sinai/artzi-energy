(() => {
  "use strict";
  // A fully local motion film: no CDN, remote codec or blocked playback requests.
  const dialog = document.getElementById("solar-film-dialog");
  const trigger = document.getElementById("open-solar-film");
  const close = document.getElementById("close-solar-film");
  const canvas = document.getElementById("solar-film-canvas");
  if (!dialog || !trigger || !canvas || !close) return;
  const ctx = canvas.getContext("2d", {alpha:false});
  if (!ctx) return;
  const lang = document.documentElement.lang === "en" ? "en" : "he";
  const toggle = document.getElementById("solar-film-toggle");
  const replay = document.getElementById("solar-film-replay");
  const elapsedText = document.getElementById("solar-film-time");
  const progress = document.getElementById("solar-film-progress");
  const sceneLabel = document.getElementById("solar-film-scene");
  const duration = 12000, w = canvas.width, h = canvas.height;
  let elapsed=0, then=null, raf=0, playing=false;
  const sceneLabels = lang==="he" ? ["האור מתחיל כאן","מהשמש למערכת חכמה","אנרגיה שמתכננים קדימה"] : ["It starts with sunlight","Designed to capture more","Planning a brighter future"];
  const clamp = (x,a=0,b=1)=>Math.min(b,Math.max(a,x));
  const mix = (a,b,t)=>a+(b-a)*t;
  function fillRect(x,y,width,height,color){ctx.fillStyle=color;ctx.fillRect(x,y,width,height);}
  function line(points,color,width=1){
    ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
  }
  function poly(points,color){
    ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
    ctx.closePath();ctx.fillStyle=color;ctx.fill();
  }
  function circle(x,y,r,color){
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
  }
  function glow(x,y,r){
    const g=ctx.createRadialGradient(x,y,4,x,y,r);
    g.addColorStop(0,"rgba(239,255,180,.92)");
    g.addColorStop(.16,"rgba(218,250,115,.5)");
    g.addColorStop(.6,"rgba(134,215,105,.13)");
    g.addColorStop(1,"rgba(134,215,105,0)");
    circle(x,y,r,g);
  }
  function sky(t){
    const g=ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0,"#041510");g.addColorStop(.58,"#123f35");g.addColorStop(1,"#295942");
    fillRect(0,0,w,h,g);
    for(let i=0;i<16;i++){
      const xx=(i*173+31)%w, yy=(i*91+52)%340;
      circle(xx,yy,1.2+(i%3)*.5,"rgba(225,255,203,.25)");
    }
    const sunX=720+Math.sin(t*.0002)*17, sunY=170-Math.sin(t*.00026)*34;
    glow(sunX,sunY,245);
    circle(sunX,sunY,65,"#defb93");
    circle(sunX-8,sunY-12,51,"#edffbb");
    ctx.strokeStyle="rgba(220,255,152,.23)";ctx.lineWidth=1;
    for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(sunX,sunY,85+i*31,0,Math.PI*2);ctx.stroke();}
    poly([[0,430],[95,382],[245,423],[390,375],[590,424],[720,382],[900,436],[960,401],[960,540],[0,540]],"#163d30");
  }
  function panel(cx,cy,ww,hh,phase){
    const skew=ww*.24, step=hh*.38;
    poly([[cx,cy],[cx+ww,cy-step],[cx+ww-skew,cy-step+hh],[cx-skew,cy+hh]],"#081a28");
    const inner=[[cx+4,cy+3],[cx+ww-5,cy-step+3],[cx+ww-skew-6,cy-step+hh-5],[cx-skew+4,cy+hh-5]];
    poly(inner,"#173d50");
    const haze=clamp((Math.sin(phase*3+cx*.013)+1)*.5);
    poly([[cx+4,cy+3],[cx+ww-5,cy-step+3],[cx+ww-skew-6,cy-step+hh-5],[cx-skew+4,cy+hh-5]],"rgba(102,210,193,"+(haze*.095)+")");
    const tl=(u,v)=>[cx+u*ww-v*skew,cy-u*step+v*hh];
    for(let i=1;i<6;i++)line([tl(i/6,0),tl(i/6,1)],"rgba(177,229,230,.37)",1);
    for(let i=1;i<4;i++)line([tl(0,i/4),tl(1,i/4)],"rgba(177,229,230,.28)",1);
    line([tl(0,0),tl(1,0),tl(1,1),tl(0,1),tl(0,0)],"#abdac8",2.2);
    const shine=(phase*.09+cx*.0008)%1;
    line([tl(shine,0),tl(shine,1)],"rgba(218,255,184,.45)",2);
  }
  function solarFarm(t,zoom=1){
    ctx.save();ctx.translate(480,325);ctx.scale(zoom,zoom);ctx.translate(-480,-325);
    // Dark structural frame.
    poly([[70,365],[620,235],[950,390],[382,534]],"#0a201b");
    poly([[85,344],[620,220],[950,375],[384,512]],"#193e39");
    for(let row=0;row<3;row++){
      const y=290+row*66, x=115+row*62;
      for(let col=0;col<5;col++){
        const cx=x+col*107, cy=y-col*23;
        panel(cx,cy,104,57,t*.001+row*.21);
      }
    }
    line([[70,365],[382,534],[950,390]],"#77aa85",3);
    ctx.restore();
  }
  function powerNetwork(t){
    const pulse=(t*.0003)%1;
    const nodes=[[290,245],[395,200],[520,225],[645,178],[770,210]];
    line(nodes,"rgba(220,252,115,.2)",7);
    line(nodes,"#a4dc72",2);
    for(let i=0;i<nodes.length-1;i++){
      const a=nodes[i],b=nodes[i+1];
      const u=(pulse*4-i+4)%4;
      if(u<1){const x=mix(a[0],b[0],u),y=mix(a[1],b[1],u);glow(x,y,24);circle(x,y,6,"#edffa6");}
    }
    nodes.forEach(([x,y],i)=>{circle(x,y,11,"#173c2f");circle(x,y,4+i%2,"#c6f590")});
    poly([[340,390],[480,310],[620,395],[620,515],[340,515]],"#123429");
    poly([[326,388],[480,297],[633,391],[614,410],[480,328],[343,411]],"#85ae80");
    for(let i=0;i<4;i++)panel(369+i*57,378-i*18,51,25,t*.001);
    for(let i=0;i<3;i++)fillRect(384+i*74,443,31,40,"#9ddc80");
    for(let i=0;i<6;i++){
      const radius=170+i*23;
      ctx.strokeStyle="rgba(219,253,129,"+(0.13-i*.013)+")";ctx.lineWidth=1.2;
      ctx.beginPath();ctx.arc(480,350,radius,Math.PI*1.1,Math.PI*1.9);ctx.stroke();
    }
  }
  function draw(t){
    const scene=Math.floor(t/4000)%3;
    ctx.save();sky(t);
    if(scene===0){
      solarFarm(t,.82);
      glow(330,360,72);
      for(let i=0;i<8;i++){
        const x=75+i*100;const yy=80+(i%3)*35;
        line([[x+Math.sin(t*.001+i)*12,yy],[x+70,yy+125]],"rgba(228,255,185,.15)",1.5);
      }
    }else if(scene===1){
      solarFarm(t,1.12);
      ctx.strokeStyle="rgba(220,252,115,.26)";
      for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(490,345,50+i*51+t%150*.2,0,Math.PI*2);ctx.stroke();}
    }else powerNetwork(t);
    const shade=ctx.createLinearGradient(0,h*.5,0,h);
    shade.addColorStop(0,"rgba(1,13,9,0)");
    shade.addColorStop(1,"rgba(1,13,9,.9)");
    fillRect(0,0,w,h,shade);
    // Designed title cards; keep them separated from localized accessible dialog copy.
    ctx.textAlign="left";
    ctx.fillStyle="#dafa73";
    ctx.font="700 17px Arial,sans-serif";
    ctx.fillText("ARTZI / ENERGY",46,52);
    ctx.textAlign="right";
    ctx.font="700 14px Arial,sans-serif";
    ctx.fillText("MOTION STORY  /  0"+(scene+1),w-46,52);
    ctx.textAlign="left";
    ctx.font="900 54px Arial,sans-serif";
    ctx.fillStyle="#f3ffe6";
    ctx.fillText(["THE LIGHT","SOLAR IN MOTION","BEYOND THE ROOF"][scene],46,h-105);
    ctx.font="700 22px Arial,sans-serif";
    ctx.fillStyle="#dafa73";
    ctx.fillText(["A NEW PERSPECTIVE","DESIGN WITH PURPOSE","POWER OF POSSIBILITY"][scene],48,h-64);
    ctx.restore();
    canvas.dataset.scene=String(scene+1);
    canvas.dataset.frame=String(Math.floor(t/100));
    if(sceneLabel)sceneLabel.textContent=sceneLabels[scene];
    if(elapsedText)elapsedText.textContent="00:"+String(Math.floor(t/1000)).padStart(2,"0")+" / 00:12";
    if(progress)progress.style.width=(100*t/duration).toFixed(2)+"%";
  }
  function tick(now){
    if(!playing || !dialog.open)return;
    if(then!==null)elapsed+=(now-then);
    then=now;
    if(elapsed>=duration)elapsed%=duration;
    draw(elapsed);
    raf=requestAnimationFrame(tick);
  }
  function setPlay(on){
    playing=on;
    then=null;
    cancelAnimationFrame(raf);
    toggle?.setAttribute("aria-pressed",on?"true":"false");
    if(toggle)toggle.textContent=on?(lang==="he"?"השהיה ❚❚":"Pause ❚❚"):(lang==="he"?"המשך ▶":"Play ▶");
    canvas.dataset.playState=on?"playing":"paused";
    if(on)raf=requestAnimationFrame(tick);
  }
  trigger.addEventListener("click",()=>{
    if(dialog.open)return;
    elapsed=0;
    dialog.showModal();
    draw(0);
    setPlay(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    close.focus();
  });
  close.addEventListener("click",()=>dialog.close());
  dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close()});
  dialog.addEventListener("close",()=>{
    setPlay(false);
    elapsed=0;
    draw(0);
    trigger.focus();
  });
  toggle?.addEventListener("click",()=>setPlay(!playing));
  replay?.addEventListener("click",()=>{elapsed=0;draw(0);setPlay(true)});
  draw(0);
})();