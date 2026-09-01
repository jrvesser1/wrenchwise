import {NextResponse} from "next/server";
import {supabaseAdmin,requireUser} from "@/lib/server";
export async function GET(req:Request){
  const v=new URL(req.url).searchParams.get("vehicle_key");
  const sb=supabaseAdmin();
  let q=sb.from("forum_threads").select("*,forum_posts(count)").order("created_at",{ascending:false}).limit(50);
  if(v) q=q.eq("vehicle_key",v);
  const {data,error}=await q;
  if(error)return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({results:data||[]});
}
export async function POST(req:Request){
  try{
    const user=await requireUser(req); const body=await req.json();
    const sb=supabaseAdmin();
    const {data,error}=await sb.from("forum_threads").insert({user_id:user.id,vehicle_key:body.vehicle_key,title:body.title,body:body.body}).select().single();
    if(error)throw error; return NextResponse.json({thread:data});
  }catch(e:any){return NextResponse.json({error:e.message||"Unable to create thread"},{status:401});}
}