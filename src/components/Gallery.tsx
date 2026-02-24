"use client";

import { useSiteConfig } from "@/config/SiteConfigContext";
import { images } from "@/config/images";
import { SectionTitle } from "./Decorative";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import { useReveal } from "@/hooks/useReveal";

export default function Gallery() {
  const { gallery } = useSiteConfig();
  const ref = useReveal();

  // Use dynamic gallery from config if available, otherwise fall back to static images
  const galleryImages = gallery.length > 0 ? gallery : images.gallery;

  return (
    <section id="gallery" className="py-24 px-6 bg-cream paisley-bg">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <SectionTitle title="Gallery" subtitle="Moments to cherish" />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {galleryImages.map((src, i) => (
            <div
              key={src}
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
      </div>
    </section>
  );
}
