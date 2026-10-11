import { createBrowserClient } from "@supabase/ssr";

export function getSupabaseCredentials(): { url: string; key: string } | null {
  if (typeof window !== "undefined") {
    const customUrl = localStorage.getItem("gdg_supabase_url");
    const customKey = localStorage.getItem("gdg_supabase_anon_key");
    if (customUrl && customKey && customUrl.startsWith("https://")) {
      return { url: customUrl, key: customKey };
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes("your-project") || !url.startsWith("https://")) {
    return null;
  }

  return { url, key };
}

export function createClient() {
  const creds = getSupabaseCredentials();
  if (!creds) {
    return null;
  }

  return createBrowserClient(creds.url, creds.key);
}
