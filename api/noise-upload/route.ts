import {NextResponse} from "next/server";
import {supabaseAdmin,requireUser} from "@/lib/server";
export async function POST(req:Request){
  try{
    const user=await requireUser(req); const form=await req.formData(); const f=form.get("file");
    if(!(f instanceof File)) return NextResponse.json({error:"Audio file required"},{status:400});
    if(f.size>15*1024*1024) return NextResponse.json({error:"Maximum file size is 15 MB."},{status:400});
    const allowed=["audio/mpeg","audio/wav","audio/x-wav","audio/mp4","audio/webm","audio/ogg"];
    if(!allowed.includes(f.type)) return NextResponse.json({error:"Use WAV, MP3, M4A, WEBM or OGG."},{status:400});
    const sb=supabaseAdmin(); const path=`${user.id}/${crypto.randomUUID()}-${f.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
    const up=await sb.storage.from("noise-clips").upload(path,f,{contentType:f.type,upsert:false});
    if(up.error)throw up.error;
    const {data,error}=await sb.from("noise_reports").insert({user_id:user.id,storage_path:path,filename:f.name,mime_type:f.type,size_bytes:f.size,notes:String(form.get("notes")||"")}).select().single();
    if(error)throw error;
    return NextResponse.json({report:data});
  }catch(e:any){return NextResponse.json({error:e.message||"Upload failed"},{status:500});}
}