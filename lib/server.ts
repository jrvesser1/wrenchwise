import { createClient } from "@supabase/supabase-js";
export function supabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth:{autoRefreshToken:false,persistSession:false}
  });
}
export async function requireUser(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) throw new Error("Unauthorized");
  const token = auth.slice(7);
  const sb = supabaseAdmin();
  const {data,error}=await sb.auth.getUser(token);
  if(error || !data.user) throw new Error("Unauthorized");
  return data.user;
}