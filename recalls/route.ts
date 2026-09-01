import { NextResponse } from "next/server";
import { recalls } from "@/lib/nhtsa";
export async function GET(req:Request){
  const {searchParams}=new URL(req.url);
  const make=searchParams.get("make"), model=searchParams.get("model"), year=searchParams.get("year");
  if(!make||!model||!year) return NextResponse.json({error:"make, model and year are required"},{status:400});
  try{return NextResponse.json({results:await recalls(make,model,year)})}
  catch(e:any){return NextResponse.json({error:e.message||"Recall lookup failed"},{status:502})}
}