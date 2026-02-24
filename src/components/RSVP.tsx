"use client";

import { useState, FormEvent } from "react";
import { MandalaCorner } from "./Decorative";
import { useReveal } from "@/hooks/useReveal";

export default function RSVP() {
  const ref = useReveal();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    numGuests: "",
    events: ["Mehendi", "Sangeet", "Wedding", "Reception"] as string[],
    dietary: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEventToggle = (event: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.details?.join(", ") || data.error || "Something went wrong"
        );
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit RSVP. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="rsvp" className="py-24 px-6 bg-maroon relative">
      <MandalaCorner position="top-left" />
      <MandalaCorner position="top-right" />
      <MandalaCorner position="bottom-left" />
      <MandalaCorner position="bottom-right" />

      <div className="max-w-2xl mx-auto relative z-10" ref={ref}>
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl text-gold font-bold tracking-wide">
            RSVP
          </h2>
          <p className="font-body text-xl text-cream-dark mt-3 italic">
            We would be honored by your presence
          </p>
          <div className="ornament-divider">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="text-gold"
            >
              <path
                d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>

        {submitted ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-10 text-center border border-gold/20">
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              className="mx-auto mb-4 text-gold"
            >
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M20 32L28 40L44 24"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <h3 className="font-display text-3xl text-gold mb-3">
              Thank You!
            </h3>
            <p className="font-body text-xl text-cream-dark">
              We&apos;ve received your RSVP. We can&apos;t wait to celebrate
              with you!
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-8 md:p-10 space-y-6 border border-gold/20"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block font-body text-lg text-cream-dark mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/10 border border-gold/30 rounded-lg px-4 py-3 text-white font-body text-lg placeholder-cream-dark/50 focus:outline-none focus:border-gold transition-colors"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block font-body text-lg text-cream-dark mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/10 border border-gold/30 rounded-lg px-4 py-3 text-white font-body text-lg placeholder-cream-dark/50 focus:outline-none focus:border-gold transition-colors"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block font-body text-lg text-cream-dark mb-2">
                Number of Guests *
              </label>
              <select
                name="numGuests"
                value={formData.numGuests}
                onChange={handleChange}
                required
                className="w-full bg-white/10 border border-gold/30 rounded-lg px-4 py-3 text-white font-body text-lg focus:outline-none focus:border-gold transition-colors"
              >
                <option value="" className="text-charcoal">
                  Select
                </option>
                <option value="1" className="text-charcoal">
                  1
                </option>
                <option value="2" className="text-charcoal">
                  2
                </option>
                <option value="3" className="text-charcoal">
                  3
                </option>
                <option value="4" className="text-charcoal">
                  4
                </option>
                <option value="5+" className="text-charcoal">
                  5+
                </option>
              </select>
            </div>

            <div>
              <label className="block font-body text-lg text-cream-dark mb-2">
                Which events will you attend? *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {["Mehendi", "Sangeet", "Wedding", "Reception"].map(
                  (event) => (
                    <label
                      key={event}
                      className="flex items-center gap-3 bg-white/5 border border-gold/20 rounded-lg px-4 py-3 cursor-pointer hover:bg-white/10 transition-colors"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-gold"
                        checked={formData.events.includes(event)}
                        onChange={() => handleEventToggle(event)}
                      />
                      <span className="font-body text-lg text-cream-dark">
                        {event}
                      </span>
                    </label>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="block font-body text-lg text-cream-dark mb-2">
                Dietary Requirements
              </label>
              <textarea
                name="dietary"
                value={formData.dietary}
                onChange={handleChange}
                rows={3}
                className="w-full bg-white/10 border border-gold/30 rounded-lg px-4 py-3 text-white font-body text-lg placeholder-cream-dark/50 focus:outline-none focus:border-gold transition-colors resize-none"
                placeholder="Any allergies or dietary preferences..."
              />
            </div>

            <div>
              <label className="block font-body text-lg text-cream-dark mb-2">
                Message for the Couple
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={3}
                className="w-full bg-white/10 border border-gold/30 rounded-lg px-4 py-3 text-white font-body text-lg placeholder-cream-dark/50 focus:outline-none focus:border-gold transition-colors resize-none"
                placeholder="Your wishes..."
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/50 rounded-lg px-4 py-3 text-red-200 font-body text-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gold text-maroon-dark font-display text-xl font-bold py-4 rounded-lg hover:bg-gold-light transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending..." : "Send RSVP"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
