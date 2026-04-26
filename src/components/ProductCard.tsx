import Link from "next/link";
import { scoreLabel } from "@/lib/supabase";

export function ProductCard({
  id,
  name,
  score,
  image,
  href,
  className,
}: {
  id: number;
  name: string | null;
  score: number | null;
  image: string | null;
  href?: string;
  className?: string;
}) {
  const s = scoreLabel(score);
  const link = href ?? `/search/item/${id}`;
  return (
    <Link
      href={link}
      className={`group relative flex flex-col rounded-2xl border border-stone-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${className ?? ""}`}
    >
      <div className={`relative aspect-square overflow-hidden rounded-xl ${s.bg}`}>
        {image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={image}
            alt={name ?? ""}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain p-3 transition group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-xs text-stone-400">
            no image
          </div>
        )}
        {score != null && (
          <div
            className={`absolute right-2 top-2 grid h-10 w-10 place-items-center rounded-full bg-white text-sm font-semibold ring-2 ${s.ring} ${s.text}`}
            title={s.label}
          >
            {Math.round(Number(score))}
          </div>
        )}
      </div>
      <p className="mt-2 line-clamp-2 min-h-[2.5em] text-sm font-medium text-stone-800 group-hover:text-emerald-700">
        {name ?? "Unnamed product"}
      </p>
    </Link>
  );
}
