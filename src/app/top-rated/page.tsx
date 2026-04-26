import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const revalidate = 600;

type Cat = {
  id: number;
  ref: string;
  label: string;
  image: string | null;
  parent: string | null;
  is_parent: boolean | null;
};

export default async function TopRatedHub() {
  const { data } = await supabase
    .from("categories")
    .select("id, ref, label, image, parent, is_parent")
    .order("is_parent", { ascending: false })
    .order("ref")
    .limit(300);
  const cats = (data ?? []) as Cat[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <h1 className="text-3xl font-semibold text-stone-900">Top-rated by category</h1>
      <p className="mt-2 text-stone-600">Pick a category to see the highest-scoring products.</p>
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        {cats.map((c) => (
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
    </div>
  );
}
