import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !anonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

// Read-only anon client — RLS lets the public role SELECT all 13 tables.
// Service-role key is NEVER referenced anywhere in the app code.
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export type ScoreCategory = "excellent" | "good" | "ok" | "poor" | "bad";

export function scoreLabel(score: number | null | undefined): {
  label: string;
  cat: ScoreCategory;
  ring: string;
  text: string;
  bg: string;
} {
  const s = Number(score ?? 0);
  if (s >= 80) return { label: "Excellent", cat: "excellent", ring: "ring-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" };
  if (s >= 60) return { label: "Good", cat: "good", ring: "ring-lime-500", text: "text-lime-700", bg: "bg-lime-50" };
  if (s >= 40) return { label: "OK", cat: "ok", ring: "ring-yellow-500", text: "text-yellow-700", bg: "bg-yellow-50" };
  if (s >= 20) return { label: "Poor", cat: "poor", ring: "ring-orange-500", text: "text-orange-700", bg: "bg-orange-50" };
  return { label: "Bad", cat: "bad", ring: "ring-red-500", text: "text-red-700", bg: "bg-red-50" };
}

export function pickImage(row: {
  mirrored_image?: string | null;
  image?: string | null;
  data?: { transparent_image?: string | null } | null;
}): string | null {
  return row.mirrored_image || row.image || row.data?.transparent_image || null;
}
