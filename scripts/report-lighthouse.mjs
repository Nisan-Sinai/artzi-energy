import {readFileSync} from "node:fs";
const files=["lighthouse-he.json","lighthouse-en.json","lighthouse-magazine.json"];
const target={performance:0.65,accessibility:0.90,"best-practices":0.80};
let allPassed=true;
for(const file of files){
 const report=JSON.parse(readFileSync(file,"utf8"));
 const scores=Object.fromEntries(Object.entries(report.categories).map(([k,v])=>[k,Math.round((v.score??0)*100)]));
 const failed=Object.entries(target).filter(([name,min])=>(report.categories[name]?.score??0)<min).map(([name,min])=>name+" below "+Math.round(min*100));
 console.log(file+": "+JSON.stringify(scores)+ (failed.length?" FAILED: "+failed.join(", "):" PASS"));
 if(failed.length)allPassed=false;
}
if(!allPassed)process.exitCode=1;
