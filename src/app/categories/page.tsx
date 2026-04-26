import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const revalidate = 3600;

type Cat = {
  id: number;
  ref: string;
  label: string;
  image: string | null;
  parent: string | null;
};

export default async function CategoriesPage() {
  const { data } = await supabase
    .from("categories")
    .select("id, ref, label, image, parent")
    .order("parent", { ascending: true, nullsFirst: true })
    .order("label");
  const cats = (data ?? []) as Cat[];

  // Group by parent
  const groups = new Map<string, Cat[]>();
  for (const c of cats) {
    const key = c.parent ?? "Top-level";
    const arr = groups.get(key) ?? [];
    arr.push(c);
    groups.set(key, arr);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <h1 className="text-3xl font-semibold text-stone-900">All categories</h1>
      <p className="mt-2 text-stone-600">
        {cats.length} categories across food, drinks, personal care, household, and more.
      </p>

      <div className="mt-10 space-y-10">
        {Array.from(groups.entries()).map(([group, items]) => (
          <section key={group}>
            <h2 className="text-lg font-semibold capitalize text-stone-700">
              {group.replaceAll("_", " ")}
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
              {items.map((c) => (
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
        ))}
      </div>
    </div>
  );
}
