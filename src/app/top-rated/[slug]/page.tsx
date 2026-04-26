import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase, pickImage } from "@/lib/supabase";
import { ProductCard } from "@/components/ProductCard";

export const revalidate = 600;

type Item = {
  id: number;
  name: string | null;
  type: string | null;
  score: number | null;
  image: string | null;
  mirrored_image: string | null;
  data: { transparent_image?: string | null } | null;
};

type Category = {
  id: number;
  ref: string;
  label: string;
  table: string | null;
  db_types: string[] | null;
};

async function getCategory(slug: string): Promise<Category | null> {
  const { data } = await supabase
    .from("categories")
    .select("id, ref, label, data")
    .eq("ref", slug)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const raw = (data as { data: { table?: string; db_types?: string[] | null } }).data ?? {};
  return {
    id: (data as { id: number }).id,
    ref: (data as { ref: string }).ref,
    label: (data as { label: string }).label,
    table: raw.table ?? "items",
    db_types: raw.db_types ?? null,
  };
}

async function getProducts(cat: Category): Promise<Item[]> {
  const table = cat.table === "water_filters" || cat.table === "air_filters"
    ? cat.table
    : "items";
  const types = cat.db_types && cat.db_types.length > 0 ? cat.db_types : [cat.ref];
  let query = supabase
    .from(table)
    .select("id, name, type, score, image, mirrored_image, data")
    .not("score", "is", null)
    .order("score", { ascending: false })
    .limit(60);
  if (table === "items") {
    query = query.in("type", types);
  }
  const { data } = await query;
  return (data ?? []) as Item[];
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = await getCategory(slug);
  if (!cat) return notFound();

  const items = await getProducts(cat);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <nav className="mb-4 text-sm text-stone-500">
        <Link href="/top-rated" className="hover:text-emerald-700">Top Rated</Link>
        <span className="mx-1">/</span>
        <span className="text-stone-700">{cat.label}</span>
      </nav>

      <h1 className="text-3xl font-semibold text-stone-900">Top-rated {cat.label}</h1>
      <p className="mt-2 text-stone-600">
        {items.length} products ranked by their Oasis score (higher = healthier).
      </p>

      {items.length === 0 ? (
        <p className="mt-12 text-stone-500">No products in this category yet.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item, i) => (
            <div key={item.id} className="relative">
              <span className="absolute -left-1 -top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-stone-900 text-xs font-bold text-white">
                {i + 1}
              </span>
              <ProductCard
                id={item.id}
                name={item.name}
                score={item.score}
                image={pickImage(item)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
