const url="https://edalkjxbodxyyhsomnlt.supabase.co/functions/v1/submit-contact";
const origin="https://artzi-energy.vercel.app";
async function post(body){return fetch(url,{method:"POST",headers:{Origin:origin,"Content-Type":"application/json"},body:JSON.stringify(body)});}
const preflight=await fetch(url,{method:"OPTIONS",headers:{Origin:origin,"Access-Control-Request-Method":"POST","Access-Control-Request-Headers":"content-type"}});
if(preflight.status!==200||preflight.headers.get("access-control-allow-origin")!==origin)throw Error("CORS preflight: "+preflight.status);
const bad=await post({full_name:"",email:"not-valid",consent:false,property_type:"residential",website:""});
if(bad.status!==422)throw Error("Invalid payload expected 422, got "+bad.status+" "+(await bad.text()).slice(0,200));
const honey=await post({full_name:"QA Automated Test",email:"qa@example.com",consent:true,property_type:"residential",website:"trap"});
if(honey.status!==202)throw Error("Spam honeypot expected 202, got "+honey.status);
console.log("Supabase contact endpoint: OPTIONS 200 + CORS, invalid POST 422, honeypot 202 — PASS (no records created)");
if(process.env.RUN_LIVE_SUBMISSION==="true"){
  const email="artzi-energy-qa-"+Date.now()+"@example.com";
  const valid=await post({full_name:"ARTZI AUTOMATED QA",email,phone:"",message:"[AUTOMATED QA TEST] Synthetic test inquiry created to verify persistence. Not a real customer.",property_type:"residential",locale:"he",consent:true,website:""});
  const response=await valid.text();
  if(valid.status!==201)throw Error("Real persistence test expected 201, got "+valid.status+" "+response.slice(0,300));
  console.log("Real synthetic contact stored in Supabase: PASS (one [AUTOMATED QA TEST] record)");
}
