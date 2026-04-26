import Link from "next/link";
import { supabase, scoreLabel, pickImage } from "@/lib/supabase";
import { ProductCard } from "@/components/ProductCard";

export const revalidate = 300;

type Category = {
  id: number;
  ref: string;
  label: string;
  image: string | null;
  parent: string | null;
  is_parent: boolean | null;
  featured: boolean | null;
};

type Item = {
  id: number;
  name: string | null;
  type: string | null;
  score: number | null;
  image: string | null;
  mirrored_image: string | null;
  data: { transparent_image?: string | null } | null;
};

async function getFeaturedCategories() {
  const { data } = await supabase
    .from("categories")
    .select("id, ref, label, image, parent, is_parent, featured")
    .eq("featured", true)
    .order("ref")
    .limit(12);
  return (data ?? []) as Category[];
}

async function getTopItems() {
  const { data } = await supabase
    .from("items")
    .select("id, name, type, score, image, mirrored_image, data")
    .gte("score", 90)
    .not("image", "is", null)
    .order("score", { ascending: false })
    .limit(12);
  return (data ?? []) as Item[];
}

export default async function HomePage() {
  const [categories, topItems] = await Promise.all([
    getFeaturedCategories(),
    getTopItems(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6">
      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
              Trusted product testing
            </span>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-900 md:text-5xl">
              Know exactly what&apos;s inside the things you buy.
            </h1>
            <p className="mt-6 text-lg text-stone-600">
              Browse {Intl.NumberFormat().format(429675)}+ products with independent lab data —
              contaminants, ingredients, sources, packaging, and a single 0–100 score.
            </p>
            <div className="mt-8 flex gap-3">
              <Link
                href="/top-rated"
                className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-emerald-700"
              >
                Browse top-rated
              </Link>
              <Link
                href="/search"
                className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
              >
                Search a product
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <FeaturedCollage items={topItems.slice(0, 6)} />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-10">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold text-stone-900">Browse categories</h2>
          <Link href="/categories" className="text-sm text-emerald-700 hover:underline">
            All categories →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/top-rated/${c.ref}`}
              className="group rounded-2xl border border-stone-200 bg-white p-3 shadow-sm transition hover:shadow"
            >
              {c.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={c.image}
                  alt={c.label}
                  className="aspect-square w-full rounded-xl bg-stone-100 object-contain p-2"
                />
              ) : (
                <div className="aspect-square w-full rounded-xl bg-stone-100" />
              )}
              <p className="mt-2 truncate text-center text-sm font-medium text-stone-700 group-hover:text-emerald-700">
                {c.label}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Top scores */}
      <section className="py-12">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold text-stone-900">Top scoring products</h2>
          <Link href="/top-rated" className="text-sm text-emerald-700 hover:underline">
            See more →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {topItems.map((item) => (
            <ProductCard
              key={item.id}
              id={item.id}
              name={item.name}
              score={item.score}
              image={pickImage(item)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function FeaturedCollage({ items }: { items: Item[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((it) => {
        const s = scoreLabel(it.score);
        const img = pickImage(it);
        return (
          <div
            key={it.id}
            className={`relative rounded-2xl border border-stone-200 ${s.bg} aspect-square overflow-hidden`}
          >
            {img ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={img} alt={it.name ?? ""} className="absolute inset-0 h-full w-full object-contain p-4" />
            ) : null}
            <div
              className={`absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white text-xs font-semibold ring-2 ${s.ring} ${s.text}`}
            >
              {Math.round(Number(it.score ?? 0))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
