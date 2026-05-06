import { createClient } from "@supabase/supabase-js";

let browserSupabaseClient = null;

export function createBrowserSupabase() {
  if (browserSupabaseClient) return browserSupabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Configuração do Supabase ausente. Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  browserSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return browserSupabaseClient;
}

export function isAllowedAdminEmail(email) {
  const allowed = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (!allowed.length) return true;
  return allowed.includes(String(email || "").toLowerCase());
}

export async function ensureAdminSession() {
  const supabase = createBrowserSupabase();
  const { data, error } = await supabase.auth.getSession();

  if (error) return null;

  const session = data?.session;

  if (!session?.user?.email) return null;

  if (!isAllowedAdminEmail(session.user.email)) {
    await supabase.auth.signOut();
    return null;
  }

  return session;
}
