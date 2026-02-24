export function OrnamentDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`ornament-divider ${className}`}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gold">
        <path
          d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

export function MandalaCorner({ position }: { position: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const rotations: Record<string, string> = {
    "top-left": "rotate(0)",
    "top-right": "rotate(90deg)",
    "bottom-right": "rotate(180deg)",
    "bottom-left": "rotate(270deg)",
  };

  const positions: Record<string, string> = {
    "top-left": "top-0 left-0",
    "top-right": "top-0 right-0",
    "bottom-left": "bottom-0 left-0",
    "bottom-right": "bottom-0 right-0",
  };

  return (
    <div
      className={`mandala-corner ${positions[position]}`}
      style={{ transform: rotations[position] }}
    >
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M0 0C0 0 30 10 50 30S70 70 70 70C70 70 50 50 30 40S0 30 0 30V0Z"
          fill="#C9A84C"
        />
        <path
          d="M0 0C0 0 20 15 35 35S45 60 45 60C45 60 35 45 20 30S0 15 0 15V0Z"
          fill="#C9A84C"
          opacity="0.5"
        />
        <circle cx="15" cy="15" r="3" fill="#C9A84C" opacity="0.8" />
        <circle cx="30" cy="30" r="2" fill="#C9A84C" opacity="0.6" />
        <circle cx="8" cy="25" r="2" fill="#C9A84C" opacity="0.6" />
        <circle cx="25" cy="8" r="2" fill="#C9A84C" opacity="0.6" />
        <path
          d="M5 5Q15 5 20 15Q25 25 40 30"
          stroke="#C9A84C"
          strokeWidth="0.5"
          fill="none"
          opacity="0.4"
        />
        <path
          d="M0 10Q10 12 15 20Q20 28 35 35"
          stroke="#C9A84C"
          strokeWidth="0.5"
          fill="none"
          opacity="0.3"
        />
      </svg>
    </div>
  );
}

export function FloralBorder() {
  return (
    <div className="w-full flex justify-center py-4">
      <svg width="300" height="20" viewBox="0 0 300 20" fill="none" className="text-gold opacity-40">
        <path
          d="M0 10 Q25 0 50 10 Q75 20 100 10 Q125 0 150 10 Q175 20 200 10 Q225 0 250 10 Q275 20 300 10"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <circle cx="50" cy="10" r="2" fill="currentColor" />
        <circle cx="150" cy="10" r="2" fill="currentColor" />
        <circle cx="250" cy="10" r="2" fill="currentColor" />
      </svg>
    </div>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-12">
      <FloralBorder />
      <h2 className="font-display text-4xl md:text-5xl text-maroon font-bold tracking-wide">
        {title}
      </h2>
      {subtitle && (
        <p className="font-body text-xl text-gold-dark mt-3 italic">{subtitle}</p>
      )}
      <OrnamentDivider />
    </div>
  );
}
