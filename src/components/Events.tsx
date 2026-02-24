"use client";

import { events } from "@/config/content";
import { images } from "@/config/images";
import { SectionTitle } from "./Decorative";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import { useReveal } from "@/hooks/useReveal";

const eventImages = [
  images.mehendiEvent,
  images.sangeetEvent,
  images.weddingEvent,
  images.receptionEvent,
];

const eventIcons = [
  // Mehendi - hand icon
  <svg key="mehendi" width="40" height="40" viewBox="0 0 40 40" fill="none">
    <path d="M20 5C20 5 10 15 10 22C10 29 15 35 20 35C25 35 30 29 30 22C30 15 20 5 20 5Z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M20 12V28" stroke="currentColor" strokeWidth="1" />
    <path d="M15 18L25 18" stroke="currentColor" strokeWidth="1" />
    <path d="M16 23L24 23" stroke="currentColor" strokeWidth="1" />
  </svg>,
  // Sangeet - music note
  <svg key="sangeet" width="40" height="40" viewBox="0 0 40 40" fill="none">
    <path d="M15 30V10L30 7V27" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="30" r="4" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="27" cy="27" r="4" stroke="currentColor" strokeWidth="1.5" />
  </svg>,
  // Wedding - rings
  <svg key="wedding" width="40" height="40" viewBox="0 0 40 40" fill="none">
    <circle cx="16" cy="22" r="8" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="24" cy="22" r="8" stroke="currentColor" strokeWidth="1.5" />
    <path d="M16 10L16 14M24 10L24 14" stroke="currentColor" strokeWidth="1.5" />
    <path d="M13 11H19M21 11H27" stroke="currentColor" strokeWidth="1.5" />
  </svg>,
  // Reception - champagne glass
  <svg key="reception" width="40" height="40" viewBox="0 0 40 40" fill="none">
    <path d="M14 5L20 18L26 5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M20 18V30" stroke="currentColor" strokeWidth="1.5" />
    <path d="M14 30H26" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 10H28" stroke="currentColor" strokeWidth="1" />
  </svg>,
];

export default function Events() {
  const ref = useReveal();

  return (
    <section id="events" className="py-24 px-6 bg-ivory">
      <div className="max-w-6xl mx-auto" ref={ref}>
        <SectionTitle title="Wedding Events" subtitle="Join us in celebration" />

        <div className="space-y-16">
          {events.map((event, i) => (
            <div
              key={event.name}
              className={`grid md:grid-cols-2 gap-10 items-center ${
                i % 2 === 1 ? "md:direction-rtl" : ""
              }`}
            >
              {/* Image */}
              <div className={`${i % 2 === 1 ? "md:order-2" : ""}`}>
                <div className="aspect-[16/10] rounded-lg overflow-hidden shadow-lg border border-gold/10">
                  <ImageWithPlaceholder
                    src={eventImages[i]}
                    alt={event.name}
                    fill
                    className="object-cover"
                    placeholderText={`${event.name} Photo`}
                  />
                </div>
              </div>

              {/* Details */}
              <div className={`${i % 2 === 1 ? "md:order-1" : ""}`}>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-sm border border-gold/10">
                  <div className="text-gold mb-4">{eventIcons[i]}</div>
                  <h3 className="font-display text-3xl text-maroon font-bold mb-3">
                    {event.name}
                  </h3>
                  <p className="font-body text-lg text-charcoal/70 mb-5">
                    {event.description}
                  </p>

                  <div className="space-y-2 font-body text-lg">
                    <div className="flex items-center gap-3">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-gold shrink-0">
                        <rect x="2" y="3" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M2 7H16" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M6 1V4M12 1V4" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-gold shrink-0">
                        <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M9 5V9L12 11" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-gold shrink-0">
                        <path d="M9 2C6 2 3 4.5 3 8C3 12.5 9 17 9 17C9 17 15 12.5 15 8C15 4.5 12 2 9 2Z" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="9" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                      <span>{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-gold shrink-0">
                        <path d="M3 14L5 6L9 9L13 4L15 14" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                      <span className="italic text-charcoal/60">{event.dresscode}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
