(() => {
  "use strict";
  const dialog=document.getElementById("solar-film-dialog");
  const video=document.getElementById("solar-real-video");
  const closeButton=document.getElementById("close-solar-film");
  const error=document.getElementById("solar-film-error");
  const sourceLink=document.getElementById("solar-film-source");
  const title=document.getElementById("solar-film-title");
  if(!dialog || !video || !closeButton)return;
  const buttons=[...document.querySelectorAll(".film-preview[data-film-src]")];
  let trigger=null;

  function showError(){
    if(error)error.hidden=false;
    video.dataset.mediaReady="error";
  }
  video.addEventListener("error",showError);
  video.addEventListener("loadeddata",()=>{
    if(error)error.hidden=true;
    video.dataset.mediaReady="true";
  });
  video.addEventListener("playing",()=>{
    if(error)error.hidden=true;
    video.dataset.playState="playing";
  });
  video.addEventListener("pause",()=>{video.dataset.playState="paused"});
  video.addEventListener("timeupdate",()=>{video.dataset.elapsed=String(video.currentTime)});

  buttons.forEach(button=>button.addEventListener("click",()=>{
    if(dialog.open)return;
    const clip=button.dataset.filmSrc;
    // Only first-party files are allowed to play: no remote CDN hotlink.
    if(!clip || !/^\/media\/solar-(rooftop|city)\.mp4$/.test(clip))return;
    trigger=button;
    if(title)title.textContent=button.dataset.filmTitle||"ARTZI ENERGY";
    if(sourceLink){
      sourceLink.href=button.dataset.filmPage||"#solar-films";
      sourceLink.title=button.dataset.filmCredit||"Pexels";
    }
    video.setAttribute("aria-label",button.getAttribute("aria-label")||"Solar video");
    video.dataset.mediaReady="loading";
    video.dataset.playState="paused";
    video.dataset.elapsed="0";
    if(error)error.hidden=true;
    video.src=clip;
    dialog.showModal();
    closeButton.focus();
    video.load();
    const attempt=video.play();
    if(attempt && typeof attempt.catch==="function"){
      attempt.catch(()=>{
        // Mobile browsers can require tapping native controls despite the user click.
        // An autoplay restriction is not a media failure.
      });
    }
  }));

  closeButton.addEventListener("click",()=>dialog.close());
  dialog.addEventListener("click",event=>{
    if(event.target===dialog)dialog.close();
  });
  dialog.addEventListener("close",()=>{
    video.pause();
    video.removeAttribute("src");
    video.load();
    video.dataset.mediaReady="idle";
    video.dataset.playState="paused";
    if(error)error.hidden=true;
    if(trigger && trigger.isConnected)trigger.focus();
  });
})();