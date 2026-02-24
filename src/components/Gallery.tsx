"use client";

import { images } from "@/config/images";
import { SectionTitle } from "./Decorative";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import { useReveal } from "@/hooks/useReveal";

export default function Gallery() {
  const ref = useReveal();

  return (
    <section id="gallery" className="py-24 px-6 bg-cream paisley-bg">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <SectionTitle title="Gallery" subtitle="Moments to cherish" />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.gallery.map((src, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-lg shadow-md border border-gold/10 group cursor-pointer ${
                i === 0 ? "row-span-2 aspect-[3/4]" : "aspect-square"
              }`}
            >
              <ImageWithPlaceholder
                src={src}
                alt={`Gallery photo ${i + 1}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                placeholderText={`Gallery ${i + 1}`}
              />
              <div className="absolute inset-0 bg-maroon/0 group-hover:bg-maroon/20 transition-colors duration-300" />
            </div>
          ))}
        </div>

        <p className="text-center font-body text-lg text-charcoal/50 mt-8 italic">
          Add your photos to /public/images/ and update src/config/images.ts
        </p>
      </div>
    </section>
  );
}
