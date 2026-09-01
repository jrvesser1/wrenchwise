 "use client";
import {useMemo,useState} from "react";
import {supabaseBrowser} from "@/lib/supabase";

type Vehicle={vin:string,make:string|null,model:string|null,year:string|null,trim:string|null,body:string|null,engine:string|null,drive:string|null,fuel:string|null,transmission:string|null};
const emptyVehicle:Vehicle={vin:"",make:null,model:null,year:null,trim:null,body:null,engine:null,drive:null,fuel:null,transmission:null};

export default function Wrenchwise(){
 const [tab,setTab]=useState("home"),[vehicle,setVehicle]=useState<Vehicle>(emptyVehicle),[vin,setVin]=useState(""),[loading,setLoading]=useState(false),[error,setError]=useState(""),[auth,setAuth]=useState(false);
 const [code,setCode]=useState(""),[codeResult,setCodeResult]=useState<any[]>([]),[codeAI,setCodeAI]=useState(""),[symptom,setSymptom]=useState(""),[symResult,setSymResult]=useState<any>(null),[threads,setThreads]=useState<any[]>([]);
 const sb=supabaseBrowser();
 const vehicleKey=useMemo(()=>vehicle.vin||[vehicle.year,vehicle.make,vehicle.model].filter(Boolean).join("-").toLowerCase(),[vehicle]);
 async function signIn(){
   const email=prompt("Enter your email. We’ll send a magic sign-in link."); if(!email)return;
   const {error}=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin}});
   alert(error?error.message:"Check your email for the sign-in link."); if(!error)setAuth(true);
 }
 async function api(path:string,opts:any={}){const {data}=await sb.auth.getSession(); const headers=new Headers(opts.headers); if(data.session)headers.set("Authorization",`Bearer ${data.session.access_token}`); return fetch(path,{...opts,headers});}
 async function decode(){setLoading(true);setError("");try{const r=await fetch("/api/vin",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({vin})});const j=await r.json();if(!r.ok)throw Error(j.error);setVehicle(j.vehicle);setTab("home")}catch(e:any){setError(e.message)}finally{setLoading(false)}}
 async function searchCodes(){setCodeAI("");const r=await fetch(`/api/codes?q=${encodeURIComponent(code)}`);const j=await r.json();setCodeResult(j.results||[]);setTab("codes")}
 async function explainCode(c:string){setCodeAI("Researching from your configured sources…");const r=await api("/api/ai/code",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:c,vehicle:{...vehicle,key:vehicleKey}})});const j=await r.json();setCodeAI(j.text||j.error)}
 async function classify(){const r=await api("/api/classify-symptom",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:symptom,vehicle})});setSymResult(await r.json());setTab("symptoms")}
 async function loadThreads(){const r=await fetch(`/api/threads?vehicle_key=${encodeURIComponent(vehicleKey)}`);const j=await r.json();setThreads(j.results||[]);setTab("forum")}
 return <main>
  <header><div className="brand">🔧 <span>Wrenchwise</span></div><button onClick={signIn}>{auth?"Signed in":"Sign in"}</button></header>
  <div className="disclaimer">Research and community information only. Always verify procedures, torque specs, wiring, safety steps and parts information against authoritative vehicle documentation.</div>
  <section className="vehiclebar"><div><b>Current vehicle</b><div className="vehicle">{vehicle.make?`${vehicle.year} ${vehicle.make} ${vehicle.model}`:"No vehicle selected"} {vehicle.vin&&<small>VIN {vehicle.vin}</small>}</div></div><input value={vin} onChange={e=>setVin(e.target.value.toUpperCase())} placeholder="Enter 17-character VIN"/><button onClick={decode} disabled={loading}>{loading?"Decoding…":"Decode VIN"}</button></section>
  <nav>{[["home","Overview"],["codes","Codes"],["symptoms","Symptoms"],["noises","Noises"],["forum","Forum"]].map(([id,label])=><button key={id} className={tab===id?"active":""} onClick={()=>id==="forum"?loadThreads():setTab(id)}>{label}</button>)}</nav>
  {error&&<div className="error">{error}</div>}
  {tab==="home"&&<section className="grid">
   <article className="hero"><span className="eyebrow">VEHICLE WORKSPACE</span><h1>Diagnose with the vehicle in context.</h1><p>Decode a VIN, pull current NHTSA recall information, search your repair knowledge base, and use AI only for constrained research and classification.</p>{vehicle.make?<div className="vehiclecard"><b>{vehicle.year} {vehicle.make} {vehicle.model}</b><span>{[vehicle.trim,vehicle.engine,vehicle.transmission].filter(Boolean).join(" • ")}</span></div>:<p className="muted">Start with the VIN above. No vehicle data is invented by this app.</p>}</article>
   <article><h2>Open recalls</h2>{vehicle.make?<RecallList v={vehicle}/>:<p className="muted">Decode a VIN to check NHTSA.</p>}</article>
   <article><h2>What Wrenchwise can show</h2><ul><li>Vehicle-specific OBD code records you or your team have sourced</li><li>Manufacturer/service-document research you add to the source library</li><li>Community repair reports with per-user confirmations</li><li>Noise uploads stored privately in Supabase Storage</li></ul></article>
  </section>}
  {tab==="codes"&&<section><h1>Diagnostic trouble codes</h1><div className="search"><input value={code} onChange={e=>setCode(e.target.value)} placeholder="P0300, P0171, ABS code…"/><button onClick={searchCodes}>Search</button></div><p className="muted">The database starts empty by design. Add properly sourced code records; Wrenchwise will not fabricate a code/fix database.</p>{codeResult.map(c=><article className="result" key={c.id}><b>{c.code}</b><h3>{c.description}</h3><p>{c.plain_language}</p><button onClick={()=>explainCode(c.code)}>Research this code with AI</button></article>)}{codeAI&&<article className="ai"><h2>AI research</h2><pre>{codeAI}</pre></article>}</section>}
  {tab==="symptoms"&&<section><h1>Describe the symptom</h1><p>AI matches your description to your stored symptom taxonomy. It does not diagnose or invent a repair.</p><textarea value={symptom} onChange={e=>setSymptom(e.target.value)} placeholder="Example: clunk when I get on the throttle after coasting…"/><button onClick={classify}>Classify symptom</button>{symResult&&<article className="ai"><pre>{JSON.stringify(symResult,null,2)}</pre></article>}</section>}
  {tab==="noises"&&<section><h1>Noise reports</h1><p>Upload your own recording. Wrenchwise stores the clip in your Supabase bucket; it does not embed third-party audio.</p><NoiseUpload api={api}/></section>}
  {tab==="forum"&&<section><h1>Vehicle forum</h1><p className="muted">{vehicle.make?`${vehicle.year} ${vehicle.make} ${vehicle.model}`:"Select a vehicle first"} • Community reports are user-submitted.</p>{threads.length?threads.map(t=><article className="result" key={t.id}><h3>{t.title}</h3><p>{t.body}</p><small>{new Date(t.created_at).toLocaleString()}</small></article>):<p>No threads yet for this vehicle.</p>}</section>}
  <footer>Wrenchwise • Built for mechanics and DIY repair research • Verify critical information with the vehicle manufacturer’s service information.</footer>
 </main>
}
function RecallList({v}:{v:Vehicle}){const [data,setData]=useState<any[]|null>(null);useState(()=>{fetch(`/api/recalls?make=${encodeURIComponent(v.make!)}&model=${encodeURIComponent(v.model!)}&year=${v.year}`).then(r=>r.json()).then(j=>setData(j.results||[])).catch(()=>setData([]))});if(data===null)return <p>Checking NHTSA…</p>;if(!data.length)return <p>No NHTSA recall results returned for this vehicle.</p>;return <div>{data.slice(0,8).map((x:any,i)=><div className="recall" key={i}><b>{x.NHTSACampaignNumber||"Recall"}</b><span>{x.Component||"Vehicle component"}</span><p>{x.Summary||x.Remedy||"See NHTSA record."}</p></div>)}</div>}
function NoiseUpload({api}:any){const [file,setFile]=useState<File|null>(null),[notes,setNotes]=useState(""),[msg,setMsg]=useState("");async function up(){if(!file)return;setMsg("Uploading…");const fd=new FormData();fd.append("file",file);fd.append("notes",notes);const r=await api("/api/noise-upload",{method:"POST",body:fd});const j=await r.json();setMsg(r.ok?"Upload saved.":j.error)}return <div className="upload"><input type="file" accept="audio/*" onChange={e=>setFile(e.target.files?.[0]||null)}/><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="When does the noise happen? Idle, cold start, acceleration, turning…"/><button onClick={up}>Upload recording</button><p>{msg}</p></div>}
