import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="label-caps">404</p>
      <h1 className="mt-2 text-ink-900">Nothing lives here.</h1>
      <p className="mt-3 text-ink-600">The page you were looking for isn&apos;t part of Masar.</p>
      <Link href="/en" className="mt-6 inline-block rounded-pill bg-peach-500 px-4 py-2 text-sm text-white hover:bg-peach-700">
        Back to the start
      </Link>
    </div>
  );
}
