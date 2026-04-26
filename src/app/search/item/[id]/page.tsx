import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase, scoreLabel, pickImage } from "@/lib/supabase";

export const revalidate = 600;

type Ingredient = {
  ingredient_id?: number | null;
  name?: string | null;
  amount?: number | null;
  exceedingLimit?: number | null;
  severity_score?: number | null;
  bonus_score?: number | null;
  is_contaminant?: boolean | null;
  measure?: string | null;
  legal_limit?: number | null;
  health_guideline?: number | null;
  category?: string | null;
  image?: string | null;
};

type ScoreRow = {
  id?: string;
  label?: string;
  score?: number;
  description?: string;
};

type LabSource = { url?: string; label?: string };

type ItemRow = {
  id: number;
  name: string | null;
  type: string | null;
  score: number | null;
  image: string | null;
  mirrored_image: string | null;
  brand_id: number | null;
  company_id: number | null;
  packaging: string | null;
  barcode: string | null;
  description: string | null;
  data: {
    ingredients?: Ingredient[];
    contaminants?: Ingredient[];
    nutrients?: Array<{ name?: string; amount?: number; nutrient_id?: number }>;
    score_breakdown?: ScoreRow[];
    sources?: Array<LabSource | string>;
    transparent_image?: string | null;
    water_source?: unknown;
    filtration_methods?: unknown;
    metadata?: Record<string, unknown> | null;
  } | null;
};

async function getItem(id: number): Promise<ItemRow | null> {
  const { data } = await supabase
    .from("items")
    .select("id, name, type, score, image, mirrored_image, brand_id, company_id, packaging, barcode, description, data")
    .eq("id", id)
    .maybeSingle();
  return (data as ItemRow) ?? null;
}

async function getBrandAndCompany(brandId: number | null, companyId: number | null) {
  const out: { brand?: string | null; company?: string | null } = {};
  if (brandId) {
    const { data } = await supabase.from("brands").select("name").eq("id", brandId).maybeSingle();
    out.brand = (data as { name?: string } | null)?.name ?? null;
  }
  if (companyId) {
    const { data } = await supabase.from("companies").select("name").eq("id", companyId).maybeSingle();
    out.company = (data as { name?: string } | null)?.name ?? null;
  }
  return out;
}

type IngredientMaster = {
  id: number;
  name: string | null;
  category: string | null;
  is_contaminant: boolean | null;
  severity_score: number | null;
  bonus_score: number | null;
  legal_limit: number | null;
  health_guideline: number | null;
  measure: string | null;
  image: string | null;
};

async function getIngredientMasters(ids: number[]): Promise<Map<number, IngredientMaster>> {
  if (ids.length === 0) return new Map();
  const { data } = await supabase
    .from("ingredients")
    .select("id, name, category, is_contaminant, severity_score, bonus_score, legal_limit, health_guideline, measure, image")
    .in("id", ids);
  const m = new Map<number, IngredientMaster>();
  for (const r of (data ?? []) as IngredientMaster[]) m.set(r.id, r);
  return m;
}

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) return notFound();

  const item = await getItem(numId);
  if (!item) return notFound();

  // Fetch in parallel: brand/company names, and the master rows for every
  // ingredient_id this product references (so we get name / severity_score /
  // legal_limit / health_guideline / image — none of which are embedded
  // inside items.data.ingredients[]).
  const rawIngs = item.data?.ingredients ?? [];
  const ingIds = rawIngs
    .map((r) => r.ingredient_id)
    .filter((x): x is number => typeof x === "number");

  const [{ brand, company }, masters] = await Promise.all([
    getBrandAndCompany(item.brand_id, item.company_id),
    getIngredientMasters(ingIds),
  ]);

  // Merge per-product (amount, exceedingLimit) with master (name, severity, limits)
  const merged = rawIngs.map((row) => {
    const m = row.ingredient_id ? masters.get(row.ingredient_id) : undefined;
    return {
      ingredient_id: row.ingredient_id,
      amount: row.amount,
      measure: row.measure ?? m?.measure ?? null,
      // Per-product flag wins; fall back to master classification
      is_contaminant: row.is_contaminant ?? m?.is_contaminant ?? false,
      exceedingLimit: row.exceedingLimit,
      // From master
      name: m?.name ?? null,
      category: m?.category ?? null,
      severity_score: m?.severity_score ?? null,
      bonus_score: m?.bonus_score ?? null,
      legal_limit: m?.legal_limit ?? null,
      health_guideline: m?.health_guideline ?? null,
      image: m?.image ?? null,
    };
  });

  const s = scoreLabel(item.score);
  const img = pickImage(item);
  const ingredients = merged;
  const contaminants = ingredients.filter((i) => i.is_contaminant);
  const nutrients = ingredients.filter((i) => !i.is_contaminant);
  const breakdown = item.data?.score_breakdown ?? [];
  const labSources = (item.data?.sources ?? [])
    .map((s) => (typeof s === "string" ? { url: s, label: undefined } : s))
    .filter((s) => s.url);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      {item.type && (
        <nav className="mb-4 text-sm text-stone-500">
          <Link href="/" className="hover:text-emerald-700">Home</Link>
          <span className="mx-1">/</span>
          <Link href={`/top-rated/${item.type}`} className="hover:text-emerald-700">
            {item.type.replaceAll("_", " ")}
          </Link>
          <span className="mx-1">/</span>
          <span className="text-stone-700 truncate inline-block max-w-[40ch] align-bottom">{item.name}</span>
        </nav>
      )}

      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        {/* Image */}
        <div className={`rounded-3xl border border-stone-200 ${s.bg} p-6 md:p-10`}>
          <div className="relative aspect-square">
            {img ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={img} alt={item.name ?? ""} className="absolute inset-0 h-full w-full object-contain" />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-stone-400">no image</div>
            )}
          </div>
        </div>

        {/* Header info */}
        <div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              {brand && (
                <p className="text-sm font-medium text-stone-500">
                  {brand}{company && company !== brand ? ` · ${company}` : ""}
                </p>
              )}
              <h1 className="text-3xl font-semibold text-stone-900 mt-1">
                {item.name ?? "Unnamed product"}
              </h1>
              {item.description && (
                <p className="mt-3 max-w-prose text-stone-600">{item.description}</p>
              )}
            </div>
            {item.score != null && (
              <div className={`flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white shadow-sm ring-4 ${s.ring}`}>
                <span className={`text-3xl font-bold ${s.text}`}>{Math.round(Number(item.score))}</span>
                <span className={`text-xs font-medium ${s.text}`}>{s.label}</span>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            {item.packaging && <Pill>📦 {item.packaging}</Pill>}
            {item.barcode && <Pill>🔢 {item.barcode}</Pill>}
            {item.type && <Pill>{item.type.replaceAll("_", " ")}</Pill>}
            <Pill className="bg-emerald-50 text-emerald-800">{contaminants.length} contaminants tested</Pill>
            <Pill className="bg-sky-50 text-sky-800">{nutrients.length} ingredients</Pill>
          </div>

          {/* Score breakdown */}
          {breakdown.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold text-stone-900">Score breakdown</h2>
              <div className="mt-3 space-y-2">
                {breakdown.map((b, i) => (
                  <div key={i} className="rounded-xl border border-stone-200 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-stone-800">{b.label ?? b.id}</span>
                      <span className="font-mono text-sm text-stone-700">{b.score}</span>
                    </div>
                    {b.description && (
                      <p className="mt-1 text-sm text-stone-500">{b.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Contaminants */}
      {contaminants.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-stone-900">Contaminants detected</h2>
          <p className="mt-1 text-sm text-stone-500">
            What we found, in the units shown, vs. legal limits and health guidelines.
          </p>
          <IngredientTable rows={contaminants} />
        </section>
      )}

      {/* Beneficial ingredients */}
      {nutrients.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-stone-900">Other ingredients</h2>
          <IngredientTable rows={nutrients} />
        </section>
      )}

      {/* Lab reports */}
      {labSources.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-stone-900">Lab reports & sources</h2>
          <ul className="mt-4 space-y-2">
            {labSources.map((s, i) => (
              <li key={i}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50"
                >
                  📄 {s.label ?? s.url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border border-stone-200 bg-stone-100 px-2.5 py-1 text-stone-700 ${className ?? ""}`}>
      {children}
    </span>
  );
}

function severityBadge(score: number | null) {
  if (score == null) return null;
  // ingredients.severity_score: 0..5 in this dataset; higher = worse.
  const s = Number(score);
  let cls = "bg-stone-100 text-stone-600";
  let label = "—";
  if (s >= 4)      { cls = "bg-red-100 text-red-700";       label = "Severe"; }
  else if (s >= 3) { cls = "bg-orange-100 text-orange-700"; label = "High"; }
  else if (s >= 2) { cls = "bg-yellow-100 text-yellow-700"; label = "Moderate"; }
  else if (s >= 1) { cls = "bg-lime-100 text-lime-800";     label = "Mild"; }
  else             { cls = "bg-emerald-100 text-emerald-800"; label = "Low"; }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      <span className="font-mono">{s}</span> {label}
    </span>
  );
}

function IngredientTable({ rows }: { rows: Ingredient[] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
          <tr>
            <th className="px-3 py-2">Ingredient</th>
            <th className="px-3 py-2">Severity</th>
            <th className="px-3 py-2">Amount</th>
            <th className="px-3 py-2">Legal limit</th>
            <th className="px-3 py-2">Health guideline</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const amt = typeof r.amount === "number" ? r.amount : null;
            const legal = typeof r.legal_limit === "number" ? r.legal_limit : null;
            const guide = typeof r.health_guideline === "number" ? r.health_guideline : null;
            const exceedsLegal = amt != null && legal != null && amt > legal;
            const exceedsGuide = amt != null && guide != null && amt > guide;
            const exceeded = (r.exceedingLimit ?? 0) > 0 || exceedsLegal || exceedsGuide;
            return (
              <tr key={i} className="border-t border-stone-100 align-middle">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {r.image && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={r.image} alt="" className="h-7 w-7 shrink-0 rounded bg-stone-100 object-contain" />
                    )}
                    <div>
                      <div className="font-medium text-stone-800">{r.name ?? `Ingredient #${r.ingredient_id ?? "?"}`}</div>
                      {r.category && (
                        <div className="text-xs text-stone-500">{r.category}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2">{severityBadge(r.severity_score ?? null)}</td>
                <td className="px-3 py-2 font-mono text-stone-700">
                  {amt != null ? `${amt} ${r.measure ?? ""}` : "—"}
                </td>
                <td className="px-3 py-2 font-mono text-stone-500">
                  {legal != null ? `${legal} ${r.measure ?? ""}` : "—"}
                </td>
                <td className="px-3 py-2 font-mono text-stone-500">
                  {guide != null ? `${guide} ${r.measure ?? ""}` : "—"}
                </td>
                <td className="px-3 py-2">
                  {exceeded ? (
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                      {exceedsLegal ? "Exceeds legal" : exceedsGuide ? "Exceeds guideline" : "Exceeds"}
                    </span>
                  ) : amt != null ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      OK
                    </span>
                  ) : (
                    <span className="text-stone-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
