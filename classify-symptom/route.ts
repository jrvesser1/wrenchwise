import {NextResponse} from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {supabaseAdmin,requireUser} from "@/lib/server";
export async function POST(req:Request){
  try{
    await requireUser(req);
    const {text,vehicle}=await req.json();
    if(!text?.trim()) return NextResponse.json({error:"Describe the symptom."},{status:400});
    const sb=supabaseAdmin();
    const {data: symptoms}=await sb.from("symptoms").select("id,name,system,description").limit(200);
    const client=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY});
    const msg=await client.messages.create({
      model:"claude-3-5-haiku-latest",max_tokens:700,
      system:`You are a classification assistant inside Wrenchwise. Do not diagnose, recommend repairs, or invent facts. Match the user's description only to the supplied symptom taxonomy. Return JSON only: {"matches":[{"symptom_id":"...","confidence":0-1,"reason":"short"}],"follow_up_questions":["..."]}. Vehicle context is only for disambiguation.`,
      messages:[{role:"user",content:JSON.stringify({text,vehicle,symptoms})}]
    });
    const raw=msg.content.find((x:any)=>x.type==="text")?.text||"{}";
    const parsed=JSON.parse(raw.replace(/^```json|```$/g,"").trim());
    return NextResponse.json(parsed);
  }catch(e:any){return NextResponse.json({error:e.message||"AI classification failed"},{status:500});}
}