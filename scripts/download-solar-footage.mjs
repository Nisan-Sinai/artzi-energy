import {mkdir, writeFile} from "node:fs/promises";
import {join} from "node:path";

const clips=[
 {id:"9790190",file:"solar-rooftop.mp4",credit:"Kindel Media / Pexels",page:"https://www.pexels.com/video/aerial-footage-of-solar-panels-on-a-rooftop-9790190/"},
 {id:"29543191",file:"solar-city.mp4",credit:"TR Studio / Pexels",page:"https://www.pexels.com/video/aerial-view-of-rooftop-solar-panels-29543191/"}
];
const maxBytes=65*1024*1024;
await mkdir("dist/media",{recursive:true});
for(const clip of clips){
 const url="https://www.pexels.com/download/video/"+clip.id+"/";
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),85000);
 try{
  console.log("Fetching licensed Pexels footage:",clip.id);
  const response=await fetch(url,{redirect:"follow",signal:controller.signal,headers:{
   "user-agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36",
   "accept":"video/mp4,video/*;q=0.9,*/*;q=0.8",
   "referer":"https://www.pexels.com/"
  }});
  if(!response.ok)throw Error("download HTTP "+response.status);
  const body=Buffer.from(await response.arrayBuffer());
  if(body.length<40000||body.length>maxBytes)throw Error("unusable media size "+body.length);
  if(body.toString("ascii",4,8)!=="ftyp")throw Error("not an MP4 file: "+response.headers.get("content-type")+" "+body.subarray(0,60).toString());
  await writeFile(join("dist/media",clip.file),body);
  console.log("MP4 SAVED "+clip.file+" bytes="+body.length+" source="+clip.page);
 }catch(error){
  console.error("Pexels video download failed ("+clip.id+"):",error);
  throw error;
 }finally{clearTimeout(timer);}
}
