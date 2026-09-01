import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/server";
export async function GET(req:Request){
  const q=new URL(req.url).searchParams.get("q")||"";
  const sb=supabaseAdmin();
  let query=sb.from("dtc_codes").select("*").order("code").limit(50);
  if(q) query=query.or(`code.ilike.%${q}%,description.ilike.%${q}%`);
  const {data,error}=await query;
  if(error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({results:data||[]});
}