import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <p className="font-body text-gold text-lg tracking-widest uppercase mb-4">
        Page Not Found
      </p>
      <h1 className="font-display text-6xl md:text-8xl text-maroon mb-6">
        404
      </h1>
      <p className="font-body text-xl text-charcoal/60 max-w-md mb-10">
        Looks like this page wandered off before the ceremony.
        Let&apos;s get you back on track.
      </p>
      <Link
        href="/"
        className="inline-block bg-maroon text-gold font-display text-lg font-bold px-8 py-3 rounded-lg hover:bg-maroon-dark transition-colors"
      >
        Back to the Wedding
      </Link>
    </div>
  );
}
