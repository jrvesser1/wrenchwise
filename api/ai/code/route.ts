import {NextResponse} from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {requireUser,supabaseAdmin} from "@/lib/server";
export async function POST(req:Request){
  try{import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser, supabaseAdmin } from "@/lib/server";

export async function POST(req: Request) {
  try {
    await requireUser(req);

    const { code, vehicle } = await req.json();

    if (!code) {
      return NextResponse.json(
        { error: "Code required" },
        { status: 400 }
      );
    }

    const sb = supabaseAdmin();

    const { data: docs, error: docsError } = await sb
      .from("repair_sources")
      .select("title, url, source_type, content")
      .eq("vehicle_key", vehicle?.key || "")
      .limit(20);

    if (docsError) {
      return NextResponse.json(
        { error: docsError.message },
        { status: 500 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 900,
      system:
        "You are a research assistant, not a mechanic. Explain an OBD code using only reliable supplied source material when available. Never claim a manufacturer procedure, TSB, recall, specification, or fix unless the supplied sources support it. Clearly label missing information. Return JSON with keys meaning, diagnostic_steps, safety_notes, source_gaps.",
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            code,
            vehicle,
            sources: docs || [],
          }),
        },
      ],
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("\n");

    return NextResponse.json({ text });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "AI request failed";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

    await requireUser(req);
    const {code,vehicle}=await req.json();
    if(!code) return NextResponse.json({error:"Code required"},{status:400});
    const sb=supabaseAdmin();
    const {data:docs}=await sb.from("repair_sources").select("title,url,source_type,content").eq("vehicle_key",vehicle?.key||"").limit(20);
    const client=new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY});
    const r=await client.messages.create({
      model:"claude-3-5-haiku-latest",max_tokens:900,
      system:`You are a research assistant, not a mechanic. Explain an OBD code using only reliable supplied source material when available. Never claim a manufacturer procedure, TSB, recall, specification, or fix unless the supplied sources support it. Clearly label missing information. Return JSON with keys meaning, diagnostic_steps, safety_notes, source_gaps.`,
      messages:[{role:"user",content:JSON.stringify({code,vehicle,sources:docs||[]})}]
    });
    const t=r.content.find((x:any)=>x.type==="text")?.text||"";
    return NextResponse.json({text:t});
  }catch(e:any){return NextResponse.json({error:e.message||"AI request failed"},{status:500});}
}
