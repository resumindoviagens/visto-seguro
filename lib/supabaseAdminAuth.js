import { createClient } from "@supabase/supabase-js";

export function createBrowserSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function ensureAdminSession() {
  const supabase = createBrowserSupabase();
  const { data } = await supabase.auth.getSession();
  const session = data?.session;

  if (!session?.user?.email) return null;

  const allowed = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (allowed.length && !allowed.includes(session.user.email.toLowerCase())) {
    return null;
  }

  return session;
}
