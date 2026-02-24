"use client";

import { ourStory } from "@/config/content";
import { images } from "@/config/images";
import { SectionTitle } from "./Decorative";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import { useReveal } from "@/hooks/useReveal";

export default function OurStory() {
  const ref = useReveal();

  return (
    <section id="our-story" className="py-24 px-6 bg-cream paisley-bg">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <SectionTitle title={ourStory.title} subtitle="How it all began" />

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Photo */}
          <div className="relative">
            <div className="aspect-[4/5] rounded-lg overflow-hidden shadow-xl border-4 border-gold/20">
              <ImageWithPlaceholder
                src={images.coupleStory}
                alt="Our Story"
                fill
                className="object-cover"
                placeholderText="Couple Photo"
              />
            </div>
            {/* Decorative frame accent */}
            <div className="absolute -top-3 -left-3 w-20 h-20 border-t-2 border-l-2 border-gold/40 rounded-tl-lg" />
            <div className="absolute -bottom-3 -right-3 w-20 h-20 border-b-2 border-r-2 border-gold/40 rounded-br-lg" />
          </div>

          {/* Text */}
          <div className="space-y-6">
            {ourStory.paragraphs.map((p, i) => (
              <p
                key={i}
                className="font-body text-xl leading-relaxed text-charcoal/80"
              >
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
