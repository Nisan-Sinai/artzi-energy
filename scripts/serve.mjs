import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
const root=resolve("dist");
const port=Number(process.env.PORT||4173);
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".xml":"application/xml; charset=utf-8",".svg":"image/svg+xml",".webmanifest":"application/manifest+json",".png":"image/png",".mp4":"video/mp4",".txt":"text/plain; charset=utf-8"};
createServer(async(req,res)=>{
  try{
    const uri=new URL(req.url,"http://localhost");
    let path=decodeURIComponent(uri.pathname);
    if(path.includes("\\")||path.includes("\0"))throw Error("Invalid path");
    if(path.endsWith("/"))path+="index.html";
    let file=resolve(root,"."+path);
    if(file!==root && !file.startsWith(root+sep))throw Error("Invalid path");
    const meta=await stat(file);
    if(meta.isDirectory())file=resolve(file,"index.html");
    const data=await readFile(file);
    const headers={"Content-Type":mime[extname(file)]||"application/octet-stream","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
    const range=req.headers.range;
    if(extname(file)===".mp4" && range){
      const match=range.match(/^bytes=(\d*)-(\d*)$/);
      if(!match)throw Error("Invalid range");
      const start=match[1]?Number(match[1]):0;
      const end=match[2]?Math.min(Number(match[2]),data.length-1):data.length-1;
      if(start>=data.length||start<0||end<start)throw Error("Range out of bounds");
      const chunk=data.subarray(start,end+1);
      res.writeHead(206,{...headers,"Accept-Ranges":"bytes","Content-Range":"bytes "+start+"-"+end+"/"+data.length,"Content-Length":chunk.length});
      if(req.method!=="HEAD")res.end(chunk);else res.end();
    }else{
      res.writeHead(200,{...headers,"Content-Length":data.length,...(extname(file)===".mp4"?{"Accept-Ranges":"bytes"}:{})});
      if(req.method!=="HEAD")res.end(data);else res.end();
    }
  }catch{
    res.writeHead(404,{"Content-Type":"text/plain; charset=utf-8"});
    res.end("Not Found");
  }
}).listen(port,"127.0.0.1",()=>console.log("Artzi preview http://127.0.0.1:"+port));
