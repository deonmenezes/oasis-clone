import Link from "next/link";
import { supabase, pickImage } from "@/lib/supabase";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

type Item = {
  id: number;
  name: string | null;
  type: string | null;
  score: number | null;
  image: string | null;
  mirrored_image: string | null;
  data: { transparent_image?: string | null } | null;
};

async function search(q: string): Promise<Item[]> {
  if (!q || q.length < 2) return [];
  // Postgres RPC: trigram fuzzy match (handles "brta" → "Brita", "wter" → "Water")
  // combined with ILIKE substring + score boost. ~50ms even at 429k rows because
  // of the GIN trigram index on items.name.
  const { data, error } = await supabase.rpc("search_items", { q, lim: 48 });
  if (error) {
    console.error("search_items RPC failed:", error);
    return [];
  }
  return (data ?? []) as Item[];
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? await search(query) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <h1 className="text-3xl font-semibold text-stone-900">Search products</h1>
      <p className="mt-2 text-stone-600">
        Type a brand, product name, or keyword. Searches 429k+ products.
      </p>

      <form action="/search" method="get" className="mt-6 flex gap-2">
        <input
          autoFocus
          type="search"
          name="q"
          defaultValue={query}
          placeholder="e.g. Eternal water, Brita, Glaceau"
          className="w-full rounded-full border border-stone-300 bg-white px-5 py-3 text-base shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
        <button
          type="submit"
          className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Search
        </button>
      </form>

      {query && (
        <div className="mt-8">
          <p className="text-sm text-stone-500">
            {results.length} result{results.length === 1 ? "" : "s"} for{" "}
            <span className="font-medium text-stone-700">&ldquo;{query}&rdquo;</span>
          </p>
          {results.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
              {results.map((item) => (
                <ProductCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  score={item.score}
                  image={pickImage(item)}
                />
              ))}
            </div>
          ) : (
            <p className="mt-12 text-center text-stone-500">
              No matches. Try a shorter or different query.
            </p>
          )}
        </div>
      )}

      {!query && (
        <div className="mt-10">
          <p className="text-sm font-medium text-stone-500">Popular searches</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["bottled water", "protein bar", "olive oil", "tampons", "shampoo", "tea"].map((t) => (
              <Link
                key={t}
                href={`/search?q=${encodeURIComponent(t)}`}
                className="rounded-full border border-stone-200 bg-white px-4 py-1.5 text-sm text-stone-700 hover:border-emerald-300 hover:text-emerald-700"
              >
                {t}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
