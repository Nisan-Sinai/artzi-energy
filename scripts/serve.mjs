import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
const root=resolve("dist");
const port=Number(process.env.PORT||4173);
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".xml":"application/xml; charset=utf-8",".svg":"image/svg+xml",".webmanifest":"application/manifest+json",".png":"image/png",".txt":"text/plain; charset=utf-8"};
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
    res.writeHead(200,{"Content-Type":mime[extname(file)]||"application/octet-stream","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});
    res.end(data);
  }catch{
    res.writeHead(404,{"Content-Type":"text/plain; charset=utf-8"});
    res.end("Not Found");
  }
}).listen(port,"127.0.0.1",()=>console.log("Artzi preview http://127.0.0.1:"+port));
