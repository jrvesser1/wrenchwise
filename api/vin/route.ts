import { NextResponse } from "next/server";
import { decodeVin } from "@/lib/nhtsa";
export async function POST(req:Request){
  try {
    const {vin}=await req.json();
    if(!vin || String(vin).trim().length!==17) return NextResponse.json({error:"Enter a 17-character VIN."},{status:400});
    return NextResponse.json({vehicle:await decodeVin(String(vin).trim().toUpperCase())});
  } catch(e:any){ return NextResponse.json({error:e.message||"VIN lookup failed"},{status:502});}
}