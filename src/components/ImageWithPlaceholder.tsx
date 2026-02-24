"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  placeholderText?: string;
  priority?: boolean;
}

export default function ImageWithPlaceholder({
  src,
  alt,
  fill,
  width,
  height,
  className = "",
  placeholderText = "Photo",
  priority = false,
}: Props) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`img-placeholder ${className} ${fill ? "absolute inset-0" : ""}`}
        style={!fill ? { width, height } : undefined}
      >
        <div className="text-center p-4">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto mb-2 opacity-50">
            <rect x="4" y="8" width="40" height="32" rx="3" stroke="currentColor" strokeWidth="2" />
            <circle cx="16" cy="20" r="4" stroke="currentColor" strokeWidth="2" />
            <path d="M4 32L16 24L24 30L32 22L44 32" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span className="text-sm opacity-70">{placeholderText}</span>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      className={className}
      priority={priority}
      onError={() => setHasError(true)}
    />
  );
}
