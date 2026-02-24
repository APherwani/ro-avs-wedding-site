"use client";

import { venue } from "@/config/content";
import { images } from "@/config/images";
import { SectionTitle } from "./Decorative";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import { useReveal } from "@/hooks/useReveal";

export default function Venue() {
  const ref = useReveal();

  return (
    <section className="py-24 px-6 bg-ivory">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <SectionTitle title="Venue" subtitle="Where the magic happens" />

        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="aspect-[16/10] rounded-lg overflow-hidden shadow-xl border border-gold/10">
            <ImageWithPlaceholder
              src={images.venue}
              alt="Wedding venue"
              fill
              className="object-cover"
              placeholderText="Venue Photo"
            />
          </div>

          <div className="space-y-5">
            <h3 className="font-display text-3xl text-maroon font-bold">
              {venue.name}
            </h3>
            <p className="font-body text-xl text-charcoal/70 leading-relaxed">
              {venue.description}
            </p>
            <div className="flex items-start gap-3 font-body text-lg">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gold shrink-0 mt-1">
                <path d="M10 2C7 2 4 4.5 4 8C4 13 10 18 10 18C10 18 16 13 16 8C16 4.5 13 2 10 2Z" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="10" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <span>{venue.address}</span>
            </div>
            <a
              href={venue.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-maroon text-white font-body text-lg px-6 py-3 rounded-lg hover:bg-maroon-dark transition-colors shadow-md"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 7L16 2L11 16L8 10L2 7Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
              View on Map
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
