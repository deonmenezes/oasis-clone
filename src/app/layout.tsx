import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oasis — trusted product testing",
  description:
    "Independent lab testing of consumer products. See exactly what's inside before you buy.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="bg-stone-50 text-stone-900 antialiased min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-emerald-700">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">O</span>
          <span className="text-lg tracking-tight">Oasis</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-stone-600 md:flex">
          <Link href="/top-rated" className="hover:text-emerald-700">Top Rated</Link>
          <Link href="/search" className="hover:text-emerald-700">Search</Link>
          <Link href="/categories" className="hover:text-emerald-700">Categories</Link>
        </nav>
        <Link
          href="/search"
          className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
        >
          Find a product
        </Link>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-8 text-xs text-stone-500 md:flex-row md:justify-between md:px-6">
        <p>
          Independent lab data. Mirrored from public Oasis Health datasets — for educational use.
        </p>
        <p>© {new Date().getFullYear()} Oasis Clone</p>
      </div>
    </footer>
  );
}
