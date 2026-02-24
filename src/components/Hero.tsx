"use client";

import { couple, weddingDate } from "@/config/content";
import { images } from "@/config/images";
import { MandalaCorner } from "./Decorative";
import CountdownTimer from "./CountdownTimer";
import ImageWithPlaceholder from "./ImageWithPlaceholder";

export default function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center">
      {/* Background image */}
      <div className="absolute inset-0">
        <ImageWithPlaceholder
          src={images.hero}
          alt="Wedding hero"
          fill
          className="object-cover"
          placeholderText="Hero Photo"
          priority
        />
        {/* Dark overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
        {/* Gold shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-maroon-dark/30 to-transparent" />
      </div>

      {/* Decorative corners */}
      <MandalaCorner position="top-left" />
      <MandalaCorner position="top-right" />
      <MandalaCorner position="bottom-left" />
      <MandalaCorner position="bottom-right" />

      {/* Content */}
      <div className="relative z-10 text-center text-white px-6 max-w-4xl animate-fade-in-up">
        <p className="font-body text-xl md:text-2xl tracking-[0.3em] uppercase text-gold-light mb-4">
          We&apos;re getting married
        </p>

        <h1 className="font-display text-6xl md:text-8xl lg:text-9xl font-bold mb-2 leading-tight">
          {couple.bride}
          <span className="font-body text-gold text-4xl md:text-5xl lg:text-6xl mx-4 italic block md:inline">
            &amp;
          </span>
          {couple.groom}
        </h1>

        <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent mx-auto my-6" />

        <p className="font-body text-2xl md:text-3xl tracking-wide text-cream-dark">
          {weddingDate.displayDate}
        </p>

        <p className="font-body text-lg tracking-[0.2em] uppercase text-gold-light/80 mt-2">
          {couple.hashtag}
        </p>

        {/* Countdown */}
        <div className="mt-10">
          <CountdownTimer targetDate={weddingDate.date} />
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gold-light">
            <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </section>
  );
}
