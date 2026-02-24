import { couple, weddingDate } from "@/config/content";
import { OrnamentDivider } from "./Decorative";

export default function Footer() {
  return (
    <footer className="bg-charcoal text-cream py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h3 className="font-display text-4xl gold-shimmer font-bold">
          {couple.bride} & {couple.groom}
        </h3>
        <OrnamentDivider />
        <p className="font-body text-xl text-cream-dark/80">
          {weddingDate.displayDate}
        </p>
        <p className="font-body text-lg text-gold mt-2 tracking-[0.2em]">
          {couple.hashtag}
        </p>
        <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent mx-auto my-8" />
        <p className="font-body text-sm text-cream-dark/50">
          Made with love
        </p>
      </div>
    </footer>
  );
}
