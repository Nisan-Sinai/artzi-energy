import {mkdir,writeFile,readFile,rm,stat} from "node:fs/promises";
import {join} from "node:path";
import {promisify} from "node:util";
import {execFile} from "node:child_process";
import ffmpeg from "ffmpeg-static";

const exec=promisify(execFile);
const clips=[
 {id:"9790190",file:"solar-rooftop.mp4",page:"https://www.pexels.com/video/aerial-footage-of-solar-panels-on-a-rooftop-9790190/",duration:11},
 {id:"29543191",file:"solar-city.mp4",page:"https://www.pexels.com/video/aerial-view-of-rooftop-solar-panels-29543191/",duration:12}
];
const folder=join("dist","media");
await mkdir(folder,{recursive:true});
if(!ffmpeg)throw Error("MP4 transcoding unavailable: ffmpeg-static missing");
for(const clip of clips){
 const original=join(folder,clip.id+"-source.mp4");
 const output=join(folder,clip.file);
 try{
  const existing=await stat(output);
  if(existing.size>=80000 && existing.size<15*1024*1024){
   const head=(await readFile(output)).toString("ascii",4,8);
   if(head==="ftyp"){console.log("VIDEO VERIFIED (cached):",clip.file,"bytes="+existing.size);continue;}
  }
 }catch{}
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),90000);
 try{
  const source="https://www.pexels.com/download/video/"+clip.id+"/";
  const res=await fetch(source,{redirect:"follow",signal:controller.signal,headers:{
   "user-agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36",
   "accept":"video/mp4,video/*;q=0.9,*/*;q=0.8","referer":"https://www.pexels.com/"
  }});
  if(!res.ok)throw Error("download HTTP "+res.status+" for "+clip.id);
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length<40000||bytes.length>150*1024*1024||bytes.toString("ascii",4,8)!=="ftyp")throw Error("invalid video download "+clip.id+" size "+bytes.length);
  await writeFile(original,bytes);
  const args=["-hide_banner","-nostdin","-loglevel","error","-y","-i",original,
    "-t",String(clip.duration),"-vf","fps=24,scale=1280:-2:force_original_aspect_ratio=decrease",
    "-c:v","libx264","-preset","veryfast","-crf","27","-pix_fmt","yuv420p",
    "-an","-movflags","+faststart",output];
  await exec(ffmpeg,args,{timeout:120000,maxBuffer:1024*1024});
  const result=await readFile(output);
  if(result.length<80000||result.length>15*1024*1024||result.toString("ascii",4,8)!=="ftyp")throw Error("transcoding unsuccessful for "+clip.id+": "+result.length);
  console.log("VIDEO VERIFIED:",clip.file,"bytes="+result.length,"source="+clip.page);
 }catch(error){
  console.error("Failed preparing licensed footage "+clip.id+":",error.message);
  throw error;
 }finally{
  clearTimeout(timer);
  await rm(original,{force:true});
 }
}