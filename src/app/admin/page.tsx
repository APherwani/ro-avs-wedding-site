"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SiteConfig, EventConfig } from "@/config/types";
import { defaultConfig } from "@/config/content";
import { images } from "@/config/images";

interface RsvpEntry {
  id: number | string;
  fullName: string;
  email: string;
  numGuests: string;
  events: string[];
  dietary: string;
  message: string;
  createdAt: string;
  source?: "database" | "backup";
  backupOnly?: boolean;
}

function getToken(): string | null {
  return sessionStorage.getItem("admin_token");
}

function setToken(token: string) {
  sessionStorage.setItem("admin_token", token);
}

function clearToken() {
  sessionStorage.removeItem("admin_token");
}

function decodeHashValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getOAuthHashValue(name: "token" | "error"): string | null {
  const prefix = `#${name}=`;
  const hash = window.location.hash;
  if (!hash.startsWith(prefix)) return null;

  const [value] = hash.slice(prefix.length).split("&");
  return decodeHashValue(value);
}

function clearOAuthHash() {
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`
  );
}

// --- OAuth error messages ---

function getOAuthErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    access_denied: "Google sign-in was cancelled.",
    missing_params: "Invalid OAuth response. Please try again.",
    invalid_state: "Session expired. Please try again.",
    token_exchange_failed: "Failed to authenticate with Google. Please try again.",
    userinfo_failed: "Could not retrieve your Google account info.",
    email_not_verified: "Your Google email is not verified.",
    not_authorized: "Your Google account is not authorized to access admin.",
  };
  return messages[code] || "Authentication failed. Please try again.";
}

// --- Login Form ---

function LoginForm() {
  const [error, setError] = useState("");

  useEffect(() => {
    let timeoutId: number | undefined;
    const errorCode = getOAuthHashValue("error");
    if (errorCode !== null) {
      const message = getOAuthErrorMessage(errorCode);
      timeoutId = window.setTimeout(() => setError(message), 0);
      clearOAuthHash();
    }
    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-display text-3xl text-maroon mb-8">
          Admin Login
        </h1>
        {error && (
          <p className="text-deep-red font-body text-sm mb-4">{error}</p>
        )}
        <button
          onClick={() => { window.location.href = "/api/admin/auth/google"; }}
          className="w-full bg-white border border-gold/30 rounded-lg px-4 py-3 font-body text-lg text-charcoal hover:bg-cream/50 transition-colors flex items-center justify-center gap-3 shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

// --- Stats Cards ---

function StatsCards({
  rsvps,
  totalGuests,
}: {
  rsvps: RsvpEntry[];
  totalGuests: number;
}) {
  const eventCounts: Record<string, number> = {};
  for (const r of rsvps) {
    for (const e of r.events) {
      eventCounts[e] = (eventCounts[e] || 0) + 1;
    }
  }
  const eventNames = Object.keys(eventCounts).sort((a, b) =>
    a.localeCompare(b)
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-xl p-5 border border-gold/20 shadow-sm">
        <p className="font-body text-sm text-charcoal/60 uppercase tracking-wider">
          Total RSVPs
        </p>
        <p className="font-display text-3xl text-maroon mt-1">
          {rsvps.length}
        </p>
      </div>
      <div className="bg-white rounded-xl p-5 border border-gold/20 shadow-sm">
        <p className="font-body text-sm text-charcoal/60 uppercase tracking-wider">
          Total Guests
        </p>
        <p className="font-display text-3xl text-maroon mt-1">
          {totalGuests}
        </p>
      </div>
      {eventNames.map((event) => (
        <div
          key={event}
          className="bg-white rounded-xl p-5 border border-gold/20 shadow-sm"
        >
          <p className="font-body text-sm text-charcoal/60 uppercase tracking-wider">
            {event}
          </p>
          <p className="font-display text-3xl text-maroon mt-1">
            {eventCounts[event] || 0}
          </p>
        </div>
      ))}
    </div>
  );
}

// --- RSVP Table ---

function RsvpTable({
  rsvps,
  onDelete,
}: {
  rsvps: RsvpEntry[];
  onDelete: (id: number) => void;
}) {
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const eventOptions = Array.from(
    new Set(rsvps.flatMap((rsvp) => rsvp.events))
  ).sort((a, b) => a.localeCompare(b));

  const filtered = rsvps.filter((r) => {
    const matchesSearch =
      !search ||
      r.fullName.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase());

    const matchesEvent = !eventFilter || r.events.includes(eventFilter);

    return matchesSearch && matchesEvent;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 border border-gold/30 rounded-lg px-4 py-2 font-body text-charcoal bg-white focus:outline-none focus:border-gold transition-colors"
        />
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="border border-gold/30 rounded-lg px-4 py-2 font-body text-charcoal bg-white focus:outline-none focus:border-gold transition-colors"
        >
          <option value="">All Events</option>
          {eventOptions.map((event) => (
            <option key={event} value={event}>
              {event}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gold/20 shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gold/20 bg-cream">
              <th className="px-4 py-3 font-display text-sm text-maroon uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 font-display text-sm text-maroon uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 font-display text-sm text-maroon uppercase tracking-wider">
                Guests
              </th>
              <th className="px-4 py-3 font-display text-sm text-maroon uppercase tracking-wider">
                Events
              </th>
              <th className="px-4 py-3 font-display text-sm text-maroon uppercase tracking-wider">
                Dietary
              </th>
              <th className="px-4 py-3 font-display text-sm text-maroon uppercase tracking-wider">
                Message
              </th>
              <th className="px-4 py-3 font-display text-sm text-maroon uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 font-display text-sm text-maroon uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center font-body text-charcoal/50"
                >
                  {rsvps.length === 0
                    ? "No RSVPs yet"
                    : "No results match your filters"}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-gold/10 hover:bg-cream/50 transition-colors"
                >
                  <td className="px-4 py-3 font-body text-charcoal">
                    <div className="flex flex-col gap-1">
                      <span>{r.fullName}</span>
                      {r.backupOnly && (
                        <span className="w-fit rounded-full bg-gold/20 px-2 py-0.5 text-xs text-maroon">
                          Backup only
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-body text-charcoal text-sm">
                    {r.email}
                  </td>
                  <td className="px-4 py-3 font-body text-charcoal text-center">
                    {r.numGuests}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.events.map((e) => (
                        <span
                          key={e}
                          className="inline-block bg-gold/20 text-maroon font-body text-xs px-2 py-0.5 rounded-full"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-body text-charcoal text-sm max-w-[150px] truncate">
                    {r.dietary || "\u2014"}
                  </td>
                  <td className="px-4 py-3 font-body text-charcoal text-sm max-w-[200px] truncate">
                    {r.message || "\u2014"}
                  </td>
                  <td className="px-4 py-3 font-body text-charcoal text-sm whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {typeof r.id !== "number" ? (
                      <span className="text-xs text-charcoal/40 font-body">
                        Backup copy
                      </span>
                    ) : confirmDelete === r.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            onDelete(r.id as number);
                            setConfirmDelete(null);
                          }}
                          className="text-xs bg-deep-red text-white px-2 py-1 rounded font-body hover:bg-deep-red/80 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-xs bg-charcoal/20 text-charcoal px-2 py-1 rounded font-body hover:bg-charcoal/30 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(r.id as number)}
                        className="text-xs text-deep-red/70 hover:text-deep-red font-body transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="font-body text-sm text-charcoal/50 mt-2">
        Showing {filtered.length} of {rsvps.length} RSVPs
      </p>
    </div>
  );
}

// --- CSV Export ---

function downloadCsv(rsvps: RsvpEntry[]) {
  const headers = [
    "Name",
    "Email",
    "Guests",
    "Events",
    "Dietary",
    "Message",
    "Date",
  ];
  const rows = rsvps.map((r) => [
    r.fullName,
    r.email,
    r.numGuests,
    r.events.join("; "),
    r.dietary,
    r.message,
    new Date(r.createdAt).toLocaleDateString(),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `rsvps-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// --- Shared input styles ---

const inputClass =
  "w-full border border-gold/30 rounded-lg px-3 py-2 font-body text-charcoal bg-white focus:outline-none focus:border-gold transition-colors";
const labelClass =
  "block font-body text-sm text-charcoal/70 mb-1 font-semibold";
type SitePhotoKey = keyof SiteConfig["photos"];

type ImageFolder = "gallery" | "events" | "site";

interface CropSettings {
  aspectWidth: number;
  aspectHeight: number;
  outputWidth: number;
  outputHeight: number;
  label: string;
}

interface CropSize {
  width: number;
  height: number;
}

interface CropOffset {
  x: number;
  y: number;
}

type CropTarget =
  | { type: "site"; field: SitePhotoKey }
  | { type: "event"; index: number }
  | {
      type: "gallery";
      remainingFiles: File[];
      totalFiles: number;
      position: number;
      slotIndex: number;
      uploadedCount: number;
      failedCount: number;
    };

interface CropSession extends CropSettings {
  id: number;
  file: File;
  previewUrl: string;
  folder: ImageFolder;
  target: CropTarget;
  title: string;
}

const heroCrop: CropSettings = {
  aspectWidth: 16,
  aspectHeight: 9,
  outputWidth: 2400,
  outputHeight: 1350,
  label: "16:9 hero crop",
};

const storyCrop: CropSettings = {
  aspectWidth: 4,
  aspectHeight: 5,
  outputWidth: 1600,
  outputHeight: 2000,
  label: "4:5 story crop",
};

const landscapeCrop: CropSettings = {
  aspectWidth: 16,
  aspectHeight: 10,
  outputWidth: 2000,
  outputHeight: 1250,
  label: "16:10 website crop",
};

const galleryCoverCrop: CropSettings = {
  aspectWidth: 3,
  aspectHeight: 4,
  outputWidth: 1500,
  outputHeight: 2000,
  label: "3:4 gallery cover crop",
};

const gallerySquareCrop: CropSettings = {
  aspectWidth: 1,
  aspectHeight: 1,
  outputWidth: 1600,
  outputHeight: 1600,
  label: "1:1 gallery crop",
};

const sitePhotoMeta: Record<
  SitePhotoKey,
  { label: string; placeholder: string; defaultSrc: string; crop: CropSettings }
> = {
  hero: {
    label: "Hero Photo",
    placeholder: "/images/hero.jpg or /api/images/site/...",
    defaultSrc: images.hero,
    crop: heroCrop,
  },
  ourStory: {
    label: "Our Story Photo",
    placeholder: "/images/couple-story.jpg or /api/images/site/...",
    defaultSrc: images.coupleStory,
    crop: storyCrop,
  },
  venue: {
    label: "Venue Photo",
    placeholder: "/images/venue.jpg or /api/images/site/...",
    defaultSrc: images.venue,
    crop: landscapeCrop,
  },
};

const sitePhotoFields = Object.keys(sitePhotoMeta) as SitePhotoKey[];

function getGalleryCrop(slotIndex: number): CropSettings {
  return slotIndex === 0 ? galleryCoverCrop : gallerySquareCrop;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getCroppedFileName(file: File): string {
  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
  return `${baseName}-cropped.jpg`;
}

function canvasToJpegFile(
  canvas: HTMLCanvasElement,
  fileName: string
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not create cropped image"));
          return;
        }
        resolve(new File([blob], fileName, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92
    );
  });
}

async function createCroppedImageFile(
  session: CropSession,
  image: HTMLImageElement,
  frameSize: CropSize,
  offset: CropOffset,
  zoom: number
): Promise<File> {
  const naturalWidth = image.naturalWidth;
  const naturalHeight = image.naturalHeight;
  const baseScale = Math.max(
    frameSize.width / naturalWidth,
    frameSize.height / naturalHeight
  );
  const effectiveScale = baseScale * zoom;
  const displayWidth = naturalWidth * effectiveScale;
  const displayHeight = naturalHeight * effectiveScale;
  const left = (frameSize.width - displayWidth) / 2 + offset.x;
  const top = (frameSize.height - displayHeight) / 2 + offset.y;
  const sourceWidth = Math.min(naturalWidth, frameSize.width / effectiveScale);
  const sourceHeight = Math.min(
    naturalHeight,
    frameSize.height / effectiveScale
  );
  const sourceX = clamp(
    -left / effectiveScale,
    0,
    naturalWidth - sourceWidth
  );
  const sourceY = clamp(
    -top / effectiveScale,
    0,
    naturalHeight - sourceHeight
  );

  const canvas = document.createElement("canvas");
  canvas.width = session.outputWidth;
  canvas.height = session.outputHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare cropped image");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvasToJpegFile(canvas, getCroppedFileName(session.file));
}

function ImageCropModal({
  session,
  onCancel,
  onApply,
}: {
  session: CropSession;
  onCancel: () => void;
  onApply: (file: File) => void;
}) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [frameSize, setFrameSize] = useState<CropSize>({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState<CropSize | null>(null);
  const [offset, setOffset] = useState<CropOffset>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragStart, setDragStart] = useState<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [creatingCrop, setCreatingCrop] = useState(false);
  const [cropError, setCropError] = useState("");

  const aspectRatio = session.aspectWidth / session.aspectHeight;
  const imageReady = Boolean(
    imageSize && frameSize.width > 0 && frameSize.height > 0
  );

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const updateFrameSize = () => {
      setFrameSize({
        width: frame.clientWidth,
        height: frame.clientHeight,
      });
    };

    updateFrameSize();
    const observer = new ResizeObserver(updateFrameSize);
    observer.observe(frame);

    return () => observer.disconnect();
  }, [session.id]);

  const clampOffset = useCallback(
    (nextOffset: CropOffset, nextZoom = zoom): CropOffset => {
      if (!imageSize || frameSize.width === 0 || frameSize.height === 0) {
        return { x: 0, y: 0 };
      }

      const baseScale = Math.max(
        frameSize.width / imageSize.width,
        frameSize.height / imageSize.height
      );
      const displayWidth = imageSize.width * baseScale * nextZoom;
      const displayHeight = imageSize.height * baseScale * nextZoom;
      const maxX = Math.max(0, (displayWidth - frameSize.width) / 2);
      const maxY = Math.max(0, (displayHeight - frameSize.height) / 2);

      return {
        x: clamp(nextOffset.x, -maxX, maxX),
        y: clamp(nextOffset.y, -maxY, maxY),
      };
    },
    [frameSize.height, frameSize.width, imageSize, zoom]
  );

  const handleZoomChange = (value: string) => {
    const nextZoom = Number(value);
    setZoom(nextZoom);
    setOffset((current) => clampOffset(current, nextZoom));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!imageReady) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragStart({
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart || dragStart.pointerId !== e.pointerId) return;
    setOffset(
      clampOffset({
        x: dragStart.originX + e.clientX - dragStart.startX,
        y: dragStart.originY + e.clientY - dragStart.startY,
      })
    );
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStart?.pointerId === e.pointerId) {
      setDragStart(null);
    }
  };

  const handleApply = async () => {
    const image = imageRef.current;
    if (!image || !imageReady) return;

    setCreatingCrop(true);
    setCropError("");

    try {
      const croppedFile = await createCroppedImageFile(
        session,
        image,
        frameSize,
        offset,
        zoom
      );
      onApply(croppedFile);
    } catch {
      setCropError("Could not crop this image. Try another photo.");
      setCreatingCrop(false);
    }
  };

  const baseScale =
    imageSize && frameSize.width > 0 && frameSize.height > 0
      ? Math.max(
          frameSize.width / imageSize.width,
          frameSize.height / imageSize.height
        )
      : 1;
  const imageStyle =
    imageSize && frameSize.width > 0 && frameSize.height > 0
      ? {
          width: `${imageSize.width * baseScale}px`,
          height: `${imageSize.height * baseScale}px`,
          transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
        }
      : { opacity: 0 };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/70 px-4 py-6">
      <div className="w-full max-w-3xl max-h-[calc(100vh-3rem)] overflow-y-auto rounded-xl bg-white border border-gold/30 shadow-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display text-xl text-maroon">
              {session.title}
            </h3>
            <p className="font-body text-xs text-charcoal/50 mt-1">
              {session.label}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="self-start font-body text-sm text-charcoal/60 hover:text-charcoal"
          >
            Cancel
          </button>
        </div>

        <div
          ref={frameRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          className={`relative mx-auto overflow-hidden rounded-lg border border-gold/30 bg-charcoal ${
            aspectRatio < 1 ? "max-w-sm" : "max-w-2xl"
          } ${dragStart ? "cursor-grabbing" : "cursor-grab"}`}
          style={{
            aspectRatio: `${session.aspectWidth} / ${session.aspectHeight}`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={session.previewUrl}
            alt={session.title}
            draggable={false}
            onLoad={(e) =>
              setImageSize({
                width: e.currentTarget.naturalWidth,
                height: e.currentTarget.naturalHeight,
              })
            }
            className="absolute left-1/2 top-1/2 max-w-none select-none touch-none"
            style={imageStyle}
          />
        </div>

        <div className="mt-4 space-y-3">
          <label className={labelClass}>Zoom</label>
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(e) => handleZoomChange(e.target.value)}
            className="w-full"
          />
        </div>

        {cropError && (
          <p className="font-body text-sm text-deep-red mt-3">{cropError}</p>
        )}

        <div className="flex flex-wrap justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            className="font-body text-sm px-4 py-2 rounded-lg border border-charcoal/20 text-charcoal hover:bg-charcoal/5 transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!imageReady || creatingCrop}
            className="font-body text-sm px-5 py-2 rounded-lg bg-maroon text-gold font-semibold hover:bg-maroon-dark transition-colors disabled:opacity-50"
          >
            {creatingCrop ? "Preparing..." : "Use Crop"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Drag gripper icon ---

function GripIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="5" cy="3" r="1.5" />
      <circle cx="11" cy="3" r="1.5" />
      <circle cx="5" cy="8" r="1.5" />
      <circle cx="11" cy="8" r="1.5" />
      <circle cx="5" cy="13" r="1.5" />
      <circle cx="11" cy="13" r="1.5" />
    </svg>
  );
}

// --- Reorder helper ---

function reorder<T>(items: T[], from: number, to: number): T[] {
  const result = [...items];
  const [moved] = result.splice(from, 1);
  result.splice(to, 0, moved);
  return result;
}

// --- Client-side image compression ---

async function compressImage(file: File): Promise<File> {
  console.log(`[compressImage] Input: ${file.name} (${file.size} bytes, ${file.type})`);

  // GIFs would lose animation through canvas — skip them
  if (file.type === "image/gif") {
    console.log("[compressImage] Skipping GIF (would lose animation)");
    return file;
  }
  // Small files don't need compression
  if (file.size < 500 * 1024) {
    console.log("[compressImage] Skipping — file under 500KB threshold");
    return file;
  }

  const MAX_DIMENSION = 2048;
  const QUALITY = 0.85;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const origWidth = img.width;
      const origHeight = img.height;
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }
      console.log(`[compressImage] Dimensions: ${origWidth}x${origHeight} → ${width}x${height}`);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.warn("[compressImage] Could not get canvas 2D context — returning original");
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.warn("[compressImage] toBlob returned null — returning original");
            resolve(file);
            return;
          }
          const outName = file.name.replace(/\.[^.]+$/, ".jpg");
          const compressed = new File([blob], outName, { type: "image/jpeg" });
          console.log(`[compressImage] Done: ${file.size} → ${compressed.size} bytes (${Math.round((1 - compressed.size / file.size) * 100)}% reduction)`);
          resolve(compressed);
        },
        "image/jpeg",
        QUALITY
      );
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      console.warn("[compressImage] Image load error — returning original:", err);
      resolve(file);
    };
    img.src = url;
  });
}

// --- Image upload helper ---

async function uploadImage(
  file: File,
  folder: ImageFolder
): Promise<{ success: boolean; url?: string; error?: string }> {
  console.log(`[uploadImage] Starting upload — file: ${file.name}, size: ${file.size}, type: ${file.type}, folder: ${folder}`);

  const token = getToken();
  if (!token) {
    console.warn("[uploadImage] No auth token found");
    return { success: false, error: "Not authenticated" };
  }

  console.log("[uploadImage] Compressing...");
  const compressed = await compressImage(file);
  console.log(`[uploadImage] After compression: ${file.name} ${file.size} → ${compressed.name} ${compressed.size} bytes`);

  if (compressed.size > 10 * 1024 * 1024) {
    console.warn("[uploadImage] File still too large after compression:", compressed.size);
    return { success: false, error: "File too large after compression (max 10MB)" };
  }

  const formData = new FormData();
  formData.append("file", compressed);
  formData.append("folder", folder);

  try {
    console.log("[uploadImage] Sending POST /api/upload...");
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    console.log(`[uploadImage] Response: ${res.status} ${res.statusText}`);

    if (!res.ok) {
      if (res.status === 404) {
        return {
          success: false,
          error: "Image uploads require the Cloudflare preview or deployed site.",
        };
      }

      let errorDetail: string;
      try {
        const data = await res.json();
        errorDetail = data.error || `HTTP ${res.status}`;
        console.error("[uploadImage] Server error response:", data);
      } catch {
        const text = await res.text();
        errorDetail = `HTTP ${res.status}: ${res.statusText}`;
        console.error("[uploadImage] Non-JSON error response:", text.slice(0, 500));
      }
      return { success: false, error: errorDetail };
    }

    const data = await res.json();
    console.log("[uploadImage] Success response:", data);
    return data;
  } catch (err) {
    console.error("[uploadImage] Network/fetch error:", err);
    return { success: false, error: "Upload failed — check console for details" };
  }
}

async function deleteImage(url: string): Promise<void> {
  const token = getToken();
  if (!token) {
    console.warn("[deleteImage] No auth token found");
    return;
  }

  // URLs are like "/api/images/gallery/uuid.jpg" — extract the R2 key after "/api/images/"
  const prefix = "/api/images/";
  const key = url.startsWith(prefix) ? url.slice(prefix.length) : url;
  console.log(`[deleteImage] Deleting key: ${key} (from url: ${url})`);

  try {
    const res = await fetch(`/api/upload?key=${encodeURIComponent(key)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`[deleteImage] Response: ${res.status} ${res.statusText}`);
  } catch (err) {
    console.error("[deleteImage] Network error:", err);
  }
}

// --- Site Config Editor ---

function ConfigEditor({ onLogout }: { onLogout: () => void }) {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [cropSession, setCropSession] = useState<CropSession | null>(null);
  const cropSessionIdRef = useRef(0);

  // Event drag state
  const [eventDragIdx, setEventDragIdx] = useState<number | null>(null);
  const [eventDropIdx, setEventDropIdx] = useState<number | null>(null);
  const [eventUploadingIdx, setEventUploadingIdx] = useState<number | null>(
    null
  );
  const [sitePhotoUploading, setSitePhotoUploading] =
    useState<SitePhotoKey | null>(null);

  // Gallery drag state
  const [galleryDragIdx, setGalleryDragIdx] = useState<number | null>(null);
  const [galleryDropIdx, setGalleryDropIdx] = useState<number | null>(null);
  const [galleryUploading, setGalleryUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (cropSession) URL.revokeObjectURL(cropSession.previewUrl);
    };
  }, [cropSession]);

  // Load current config
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setConfig({
            couple: { ...defaultConfig.couple, ...data.config.couple },
            weddingDate: {
              ...defaultConfig.weddingDate,
              ...data.config.weddingDate,
            },
            ourStory: {
              ...defaultConfig.ourStory,
              ...data.config.ourStory,
            },
            events:
              Array.isArray(data.config.events) &&
              data.config.events.length > 0
                ? data.config.events
                : defaultConfig.events,
            venue: { ...defaultConfig.venue, ...data.config.venue },
            photos: { ...defaultConfig.photos, ...data.config.photos },
            gallery: Array.isArray(data.config.gallery)
              ? data.config.gallery
              : defaultConfig.gallery,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingConfig(false));
  }, []);

  const handleSave = async () => {
    if (cropSession) {
      setMessage({
        type: "error",
        text: "Finish or cancel photo cropping before saving.",
      });
      return;
    }

    if (eventUploadingIdx !== null || sitePhotoUploading !== null || galleryUploading) {
      setMessage({
        type: "error",
        text: "Wait for the photo upload to finish before saving.",
      });
      return;
    }

    const token = getToken();
    if (!token) {
      onLogout();
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ config }),
      });

      if (res.status === 401) {
        onLogout();
        return;
      }

      if (!res.ok) {
        let errorText = `Failed to save config (HTTP ${res.status})`;
        if (res.headers.get("content-type")?.includes("application/json")) {
          const data = await res.json();
          errorText = data.error || errorText;
        }
        setMessage({ type: "error", text: errorText });
        return;
      }

      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Site config saved! Changes are live." });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to save config",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Connection failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(defaultConfig);
    setMessage(null);
  };

  const updateCouple = (field: keyof SiteConfig["couple"], value: string) => {
    setConfig((prev) => ({
      ...prev,
      couple: { ...prev.couple, [field]: value },
    }));
  };

  const updateWeddingDate = (
    field: keyof SiteConfig["weddingDate"],
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      weddingDate: { ...prev.weddingDate, [field]: value },
    }));
  };

  const updateOurStory = (
    field: keyof SiteConfig["ourStory"],
    value: string | string[]
  ) => {
    setConfig((prev) => ({
      ...prev,
      ourStory: { ...prev.ourStory, [field]: value },
    }));
  };

  const updateEvent = (
    index: number,
    field: keyof EventConfig,
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      events: prev.events.map((e, i) =>
        i === index ? { ...e, [field]: value } : e
      ),
    }));
  };

  const addEvent = () => {
    setConfig((prev) => ({
      ...prev,
      events: [
        ...prev.events,
        {
          name: "New Event",
          date: "",
          time: "",
          venue: "",
          address: "",
          description: "",
          dresscode: "",
        },
      ],
    }));
  };

  const removeEvent = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      events: prev.events.filter((_, i) => i !== index),
    }));
  };

  const reorderEvents = (from: number, to: number) => {
    if (from === to) return;
    setConfig((prev) => ({
      ...prev,
      events: reorder(prev.events, from, to),
    }));
  };

  const updateVenue = (field: keyof SiteConfig["venue"], value: string) => {
    setConfig((prev) => ({
      ...prev,
      venue: { ...prev.venue, [field]: value },
    }));
  };

  const updatePhoto = (field: SitePhotoKey, value: string) => {
    setConfig((prev) => ({
      ...prev,
      photos: { ...prev.photos, [field]: value },
    }));
  };

  const openCropSession = useCallback(
    (
      file: File,
      options: Omit<CropSession, "id" | "file" | "previewUrl">
    ) => {
      cropSessionIdRef.current += 1;
      setCropSession({
        id: cropSessionIdRef.current,
        file,
        previewUrl: URL.createObjectURL(file),
        ...options,
      });
    },
    []
  );

  const openGalleryCrop = useCallback(
    (
      file: File,
      remainingFiles: File[],
      position: number,
      totalFiles: number,
      slotIndex: number,
      uploadedCount: number,
      failedCount: number
    ) => {
      const crop = getGalleryCrop(slotIndex);
      openCropSession(file, {
        ...crop,
        folder: "gallery",
        target: {
          type: "gallery",
          remainingFiles,
          totalFiles,
          position,
          slotIndex,
          uploadedCount,
          failedCount,
        },
        title:
          totalFiles > 1
            ? `Crop Gallery Photo ${position} of ${totalFiles}`
            : "Crop Gallery Photo",
      });
    },
    [openCropSession]
  );

  // --- Site photo upload ---

  const handleSitePhotoUpload = async (
    field: SitePhotoKey,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    console.log(`[handleSitePhotoUpload] ${field} — file selected:`, file ? `${file.name} (${file.size} bytes, ${file.type})` : "none");
    if (!file) return;
    e.target.value = "";

    setMessage(null);
    openCropSession(file, {
      ...sitePhotoMeta[field].crop,
      folder: "site",
      target: { type: "site", field },
      title: `Crop ${sitePhotoMeta[field].label}`,
    });
  };

  const handleClearSitePhoto = (field: SitePhotoKey) => {
    updatePhoto(field, "");
    setMessage({
      type: "success",
      text: "Photo cleared. Save changes to publish it.",
    });
  };

  // --- Event image upload ---

  const handleEventImageUpload = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    console.log(`[handleEventImageUpload] Event ${index} — file selected:`, file ? `${file.name} (${file.size} bytes, ${file.type})` : "none");
    if (!file) return;
    e.target.value = ""; // clear after capturing file reference

    setMessage(null);
    openCropSession(file, {
      ...landscapeCrop,
      folder: "events",
      target: { type: "event", index },
      title: `Crop ${config.events[index]?.name || `Event ${index + 1}`} Photo`,
    });
  };

  const handleRemoveEventImage = (index: number) => {
    updateEvent(index, "image", "");
    setMessage({
      type: "success",
      text: "Event photo cleared. Save changes to publish it.",
    });
  };

  // --- Gallery handlers ---

  const handleGalleryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    console.log(`[handleGalleryUpload] Files selected:`, files ? files.length : 0);
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files); // snapshot before clearing
    e.target.value = "";
    setMessage(null);

    const [firstFile, ...remainingFiles] = fileArray;
    openGalleryCrop(
      firstFile,
      remainingFiles,
      1,
      fileArray.length,
      config.gallery.length,
      0,
      0
    );
  };

  const handleCroppedPhoto = async (croppedFile: File) => {
    const session = cropSession;
    if (!session) return;

    setCropSession(null);
    setMessage(null);

    if (session.target.type === "site") {
      const { field } = session.target;
      setSitePhotoUploading(field);
      const result = await uploadImage(croppedFile, session.folder);
      console.log("[handleCroppedPhoto] Site upload result:", result);
      if (result.success && result.url) {
        updatePhoto(field, result.url);
        setMessage({
          type: "success",
          text: "Photo uploaded. Save changes to publish it.",
        });
      } else {
        setMessage({ type: "error", text: result.error || "Upload failed" });
      }
      setSitePhotoUploading(null);
      return;
    }

    if (session.target.type === "event") {
      const { index } = session.target;
      setEventUploadingIdx(index);
      const result = await uploadImage(croppedFile, session.folder);
      console.log("[handleCroppedPhoto] Event upload result:", result);
      if (result.success && result.url) {
        updateEvent(index, "image", result.url);
        setMessage({
          type: "success",
          text: "Event photo uploaded. Save changes to publish it.",
        });
      } else {
        setMessage({ type: "error", text: result.error || "Upload failed" });
      }
      setEventUploadingIdx(null);
      return;
    }

    setGalleryUploading(true);
    const result = await uploadImage(croppedFile, session.folder);
    console.log("[handleCroppedPhoto] Gallery upload result:", result);

    let nextUploadedCount = session.target.uploadedCount;
    let nextFailedCount = session.target.failedCount;
    let nextSlotIndex = session.target.slotIndex;

    if (result.success && result.url) {
      nextUploadedCount += 1;
      nextSlotIndex += 1;
      setConfig((prev) => ({
        ...prev,
        gallery: [...prev.gallery, result.url as string],
      }));
    } else {
      nextFailedCount += 1;
    }

    setGalleryUploading(false);

    const [nextFile, ...remainingFiles] = session.target.remainingFiles;
    if (nextFile) {
      openGalleryCrop(
        nextFile,
        remainingFiles,
        session.target.position + 1,
        session.target.totalFiles,
        nextSlotIndex,
        nextUploadedCount,
        nextFailedCount
      );
      return;
    }

    if (nextFailedCount > 0) {
      setMessage({
        type: "error",
        text:
          nextUploadedCount > 0
            ? `${nextUploadedCount} gallery photo${
                nextUploadedCount === 1 ? "" : "s"
              } uploaded, ${nextFailedCount} failed. Save changes to publish uploaded photos.`
            : result.error || "Gallery upload failed",
      });
      return;
    }

    if (nextUploadedCount > 0) {
      setMessage({
        type: "success",
        text: `${nextUploadedCount} gallery photo${
          nextUploadedCount === 1 ? "" : "s"
        } uploaded. Save changes to publish ${
          nextUploadedCount === 1 ? "it" : "them"
        }.`,
      });
    }
  };

  const removeGalleryImage = async (index: number) => {
    const url = config.gallery[index];
    console.log(`[removeGalleryImage] Removing index ${index}, url:`, url || "(none)");
    if (url) {
      await deleteImage(url);
    }
    setConfig((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index),
    }));
  };

  const reorderGallery = (from: number, to: number) => {
    if (from === to) return;
    setConfig((prev) => ({
      ...prev,
      gallery: reorder(prev.gallery, from, to),
    }));
  };

  if (loadingConfig) {
    return (
      <div className="text-center py-10">
        <p className="font-body text-charcoal/50">Loading config...</p>
      </div>
    );
  }

  const uploadInProgress =
    eventUploadingIdx !== null || sitePhotoUploading !== null || galleryUploading;
  const photoWorkInProgress = uploadInProgress || cropSession !== null;

  return (
    <div className="space-y-8">
      {cropSession && (
        <ImageCropModal
          key={cropSession.id}
          session={cropSession}
          onCancel={() => setCropSession(null)}
          onApply={handleCroppedPhoto}
        />
      )}

      {/* Save bar */}
      <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-gold/20 shadow-sm sticky top-0 z-10">
        <div>
          {message && (
            <p
              className={`font-body text-sm ${
                message.type === "success"
                  ? "text-green-700"
                  : "text-deep-red"
              }`}
            >
              {message.text}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="font-body text-sm px-4 py-2 rounded-lg border border-charcoal/20 text-charcoal hover:bg-charcoal/5 transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving || photoWorkInProgress}
            className="font-body text-sm px-6 py-2 rounded-lg bg-maroon text-gold font-semibold hover:bg-maroon-dark transition-colors disabled:opacity-50"
          >
            {cropSession
              ? "Cropping..."
              : uploadInProgress
                ? "Uploading..."
                : saving
                  ? "Saving..."
                  : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Couple */}
      <section className="bg-white rounded-xl p-6 border border-gold/20 shadow-sm">
        <h3 className="font-display text-xl text-maroon mb-4">
          Couple Details
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Groom Name</label>
            <input
              className={inputClass}
              value={config.couple.groom}
              onChange={(e) => updateCouple("groom", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Bride Name</label>
            <input
              className={inputClass}
              value={config.couple.bride}
              onChange={(e) => updateCouple("bride", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Full Names</label>
            <input
              className={inputClass}
              value={config.couple.fullNames}
              onChange={(e) => updateCouple("fullNames", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Hashtag</label>
            <input
              className={inputClass}
              value={config.couple.hashtag}
              onChange={(e) => updateCouple("hashtag", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Wedding Date */}
      <section className="bg-white rounded-xl p-6 border border-gold/20 shadow-sm">
        <h3 className="font-display text-xl text-maroon mb-4">
          Wedding Date
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Countdown Date (ISO format)
            </label>
            <input
              className={inputClass}
              value={config.weddingDate.date}
              onChange={(e) => updateWeddingDate("date", e.target.value)}
              placeholder="2026-12-12T17:00:00"
            />
            <p className="font-body text-xs text-charcoal/40 mt-1">
              Used for the countdown timer, e.g. 2026-12-12T17:00:00
            </p>
          </div>
          <div>
            <label className={labelClass}>Display Date</label>
            <input
              className={inputClass}
              value={config.weddingDate.displayDate}
              onChange={(e) =>
                updateWeddingDate("displayDate", e.target.value)
              }
              placeholder="December 12, 2026"
            />
          </div>
        </div>
      </section>

      {/* Site Photos */}
      <section className="bg-white rounded-xl p-6 border border-gold/20 shadow-sm">
        <h3 className="font-display text-xl text-maroon mb-4">Site Photos</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {sitePhotoFields.map((field) => {
            const meta = sitePhotoMeta[field];
            const value = config.photos[field];
            const previewSrc = value || meta.defaultSrc;
            const uploading = sitePhotoUploading === field;

            return (
              <div
                key={field}
                className="border border-gold/15 rounded-lg p-4 bg-cream/30"
              >
                <label className={labelClass}>{meta.label}</label>
                <div
                  className="rounded-lg overflow-hidden border border-gold/20 bg-cream-dark mb-3"
                  style={{
                    aspectRatio: `${meta.crop.aspectWidth} / ${meta.crop.aspectHeight}`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewSrc}
                    alt={meta.label}
                    className="w-full h-full object-cover"
                  />
                </div>
                <input
                  className={inputClass}
                  value={value}
                  onChange={(e) => updatePhoto(field, e.target.value)}
                  placeholder={meta.placeholder}
                />
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <label
                    className={`text-xs font-body cursor-pointer transition-colors ${
                      uploading
                        ? "text-charcoal/40 cursor-wait"
                        : "text-gold hover:text-gold-dark"
                    }`}
                  >
                    {uploading
                      ? "Uploading..."
                      : value
                        ? "Change Photo"
                        : "Upload Photo"}
                    {!uploading && (
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleSitePhotoUpload(field, e)}
                      />
                    )}
                  </label>
                  {value && (
                    <button
                      type="button"
                      onClick={() => handleClearSitePhoto(field)}
                      className="text-xs text-deep-red/70 hover:text-deep-red font-body"
                    >
                      Clear Photo
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Our Story */}
      <section className="bg-white rounded-xl p-6 border border-gold/20 shadow-sm">
        <h3 className="font-display text-xl text-maroon mb-4">Our Story</h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Section Title</label>
            <input
              className={inputClass}
              value={config.ourStory.title}
              onChange={(e) => updateOurStory("title", e.target.value)}
            />
          </div>
          {config.ourStory.paragraphs.map((p, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass}>Paragraph {i + 1}</label>
                {config.ourStory.paragraphs.length > 1 && (
                  <button
                    onClick={() =>
                      updateOurStory(
                        "paragraphs",
                        config.ourStory.paragraphs.filter(
                          (_, idx) => idx !== i
                        )
                      )
                    }
                    className="text-xs text-deep-red/70 hover:text-deep-red font-body"
                  >
                    Remove
                  </button>
                )}
              </div>
              <textarea
                className={inputClass + " resize-none"}
                rows={3}
                value={p}
                onChange={(e) => {
                  const updated = [...config.ourStory.paragraphs];
                  updated[i] = e.target.value;
                  updateOurStory("paragraphs", updated);
                }}
              />
            </div>
          ))}
          <button
            onClick={() =>
              updateOurStory("paragraphs", [
                ...config.ourStory.paragraphs,
                "",
              ])
            }
            className="font-body text-sm text-gold hover:text-gold-dark transition-colors"
          >
            + Add Paragraph
          </button>
        </div>
      </section>

      {/* Events (with drag-to-reorder + image upload) */}
      <section className="bg-white rounded-xl p-6 border border-gold/20 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl text-maroon">Events</h3>
          <button
            onClick={addEvent}
            className="font-body text-sm bg-gold/20 text-maroon px-3 py-1.5 rounded-lg hover:bg-gold/30 transition-colors"
          >
            + Add Event
          </button>
        </div>
        <p className="font-body text-xs text-charcoal/40 mb-4">
          Drag the grip handle to reorder events
        </p>
        <div className="space-y-6">
          {config.events.map((event, i) => (
            <div
              key={i}
              onDragOver={(e) => {
                e.preventDefault();
                setEventDropIdx(i);
              }}
              onDragLeave={() => setEventDropIdx(null)}
              onDrop={(e) => {
                e.preventDefault();
                if (eventDragIdx !== null) reorderEvents(eventDragIdx, i);
                setEventDragIdx(null);
                setEventDropIdx(null);
              }}
              className={`border rounded-lg p-5 bg-cream/30 transition-all ${
                eventDropIdx === i && eventDragIdx !== i
                  ? "border-gold border-t-4"
                  : "border-gold/15"
              } ${eventDragIdx === i ? "opacity-40" : ""}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    draggable
                    onDragStart={(e) => {
                      setEventDragIdx(i);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => {
                      setEventDragIdx(null);
                      setEventDropIdx(null);
                    }}
                    className="cursor-grab active:cursor-grabbing text-charcoal/30 hover:text-charcoal/60"
                    title="Drag to reorder"
                  >
                    <GripIcon />
                  </span>
                  <h4 className="font-display text-lg text-maroon">
                    {event.name || `Event ${i + 1}`}
                  </h4>
                </div>
                {config.events.length > 1 && (
                  <button
                    onClick={() => removeEvent(i)}
                    className="text-xs text-deep-red/70 hover:text-deep-red font-body"
                  >
                    Remove Event
                  </button>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Event Name</label>
                  <input
                    className={inputClass}
                    value={event.name}
                    onChange={(e) => updateEvent(i, "name", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Date</label>
                  <input
                    className={inputClass}
                    value={event.date}
                    onChange={(e) => updateEvent(i, "date", e.target.value)}
                    placeholder="December 10, 2026"
                  />
                </div>
                <div>
                  <label className={labelClass}>Time</label>
                  <input
                    className={inputClass}
                    value={event.time}
                    onChange={(e) => updateEvent(i, "time", e.target.value)}
                    placeholder="2:00 PM onwards"
                  />
                </div>
                <div>
                  <label className={labelClass}>Venue Name</label>
                  <input
                    className={inputClass}
                    value={event.venue}
                    onChange={(e) => updateEvent(i, "venue", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Address</label>
                  <input
                    className={inputClass}
                    value={event.address}
                    onChange={(e) =>
                      updateEvent(i, "address", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Dress Code</label>
                  <input
                    className={inputClass}
                    value={event.dresscode}
                    onChange={(e) =>
                      updateEvent(i, "dresscode", e.target.value)
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Description</label>
                  <textarea
                    className={inputClass + " resize-none"}
                    rows={2}
                    value={event.description}
                    onChange={(e) =>
                      updateEvent(i, "description", e.target.value)
                    }
                  />
                </div>
                {/* Event Image */}
                <div className="md:col-span-2">
                  <label className={labelClass}>Event Image</label>
                  <div className="grid sm:grid-cols-[10rem_1fr] gap-3 items-start">
                    <div className="w-full aspect-[16/10] rounded border border-gold/20 overflow-hidden bg-cream-dark flex items-center justify-center">
                      {event.image ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={event.image}
                            alt={event.name}
                            className="w-full h-full object-cover"
                          />
                        </>
                      ) : (
                        <span className="font-body text-xs text-charcoal/40">
                          No photo
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <input
                        className={inputClass}
                        value={event.image || ""}
                        onChange={(e) => updateEvent(i, "image", e.target.value)}
                        placeholder="/images/mehendi.jpg or /api/images/events/..."
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <label
                          className={`text-xs font-body cursor-pointer transition-colors ${
                            eventUploadingIdx === i
                              ? "text-charcoal/40 cursor-wait"
                              : "text-gold hover:text-gold-dark"
                          }`}
                        >
                          {eventUploadingIdx === i
                            ? "Uploading..."
                            : event.image
                              ? "Change Photo"
                              : "Upload Photo"}
                          {eventUploadingIdx !== i && (
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleEventImageUpload(i, e)}
                            />
                          )}
                        </label>
                        {event.image && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEventImage(i)}
                            className="text-xs text-deep-red/70 hover:text-deep-red font-body"
                          >
                            Clear Photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section className="bg-white rounded-xl p-6 border border-gold/20 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl text-maroon">Gallery</h3>
          <label className="font-body text-sm bg-gold/20 text-maroon px-3 py-1.5 rounded-lg hover:bg-gold/30 transition-colors cursor-pointer">
            + Upload Photos
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleGalleryUpload}
            />
          </label>
        </div>

        {config.gallery.length === 0 ? (
          <p className="font-body text-charcoal/50 text-sm py-8 text-center">
            No gallery photos yet. Upload some to get started.
          </p>
        ) : (
          <>
            <p className="font-body text-xs text-charcoal/40 mb-3">
              Drag to reorder. Hover to delete.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {config.gallery.map((url, i) => (
                <div
                  key={url}
                  draggable
                  onDragStart={(e) => {
                    setGalleryDragIdx(i);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setGalleryDropIdx(i);
                  }}
                  onDragLeave={() => setGalleryDropIdx(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (galleryDragIdx !== null) reorderGallery(galleryDragIdx, i);
                    setGalleryDragIdx(null);
                    setGalleryDropIdx(null);
                  }}
                  onDragEnd={() => {
                    setGalleryDragIdx(null);
                    setGalleryDropIdx(null);
                  }}
                  className={`relative rounded-lg overflow-hidden group cursor-grab active:cursor-grabbing border-2 transition-all ${
                    galleryDropIdx === i && galleryDragIdx !== i
                      ? "border-gold"
                      : "border-transparent"
                  } ${i === 0 ? "row-span-2 aspect-[3/4]" : "aspect-square"} ${
                    galleryDragIdx === i ? "opacity-40" : ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Gallery ${i + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  <button
                    onClick={() => removeGalleryImage(i)}
                    className="absolute top-1 right-1 bg-deep-red/80 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                  >
                    &times;
                  </button>
                  <div className="absolute bottom-1 left-1 bg-black/50 text-white rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripIcon />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {galleryUploading && (
          <p className="font-body text-sm text-charcoal/50 mt-3">
            Uploading...
          </p>
        )}
      </section>

      {/* Venue */}
      <section className="bg-white rounded-xl p-6 border border-gold/20 shadow-sm">
        <h3 className="font-display text-xl text-maroon mb-4">Venue</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Venue Name</label>
            <input
              className={inputClass}
              value={config.venue.name}
              onChange={(e) => updateVenue("name", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Address</label>
            <input
              className={inputClass}
              value={config.venue.address}
              onChange={(e) => updateVenue("address", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Google Maps URL</label>
            <input
              className={inputClass}
              value={config.venue.mapUrl}
              onChange={(e) => updateVenue("mapUrl", e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea
              className={inputClass + " resize-none"}
              rows={3}
              value={config.venue.description}
              onChange={(e) => updateVenue("description", e.target.value)}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

// --- Main Admin Page ---

type AdminTab = "rsvps" | "config";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("rsvps");
  const [rsvps, setRsvps] = useState<RsvpEntry[]>([]);
  const [totalGuests, setTotalGuests] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRsvps = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/rsvp", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        clearToken();
        setAuthed(false);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setRsvps(data.rsvps);
        setTotalGuests(data.totalGuests);
      } else {
        setError(data.error || "Failed to load RSVPs");
      }
    } catch {
      setError("Connection failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (id: number) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/rsvp?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        clearToken();
        setAuthed(false);
        return;
      }

      setRsvps((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("Failed to delete RSVP");
    }
  };

  const handleLogout = () => {
    clearToken();
    setAuthed(false);
    setRsvps([]);
  };

  // Check for OAuth callback token or existing session on mount
  useEffect(() => {
    // OAuth callback — token passed in URL hash
    const token = getOAuthHashValue("token");
    if (token !== null) {
      setToken(token);
      setAuthed(true);
      clearOAuthHash();
      return;
    }

    // OAuth error — handled by LoginForm, just clear loading
    if (getOAuthHashValue("error") !== null) {
      setLoading(false);
      return;
    }

    // Existing session
    if (getToken()) {
      setAuthed(true);
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch RSVPs when authenticated
  useEffect(() => {
    if (authed) {
      fetchRsvps();
    }
  }, [authed, fetchRsvps]);

  if (!authed) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-maroon px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="font-display text-2xl text-gold">Wedding Admin</h1>
          <div className="flex items-center gap-3">
            {activeTab === "rsvps" && (
              <>
                <button
                  onClick={() => downloadCsv(rsvps)}
                  disabled={rsvps.length === 0}
                  className="bg-gold/20 text-gold font-body text-sm px-4 py-2 rounded-lg hover:bg-gold/30 transition-colors disabled:opacity-50"
                >
                  Download CSV
                </button>
                <button
                  onClick={fetchRsvps}
                  className="bg-gold/20 text-gold font-body text-sm px-4 py-2 rounded-lg hover:bg-gold/30 transition-colors"
                >
                  Refresh
                </button>
              </>
            )}
            <button
              onClick={handleLogout}
              className="text-cream-dark font-body text-sm hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-maroon-dark/30 border-b border-gold/10">
        <div className="max-w-6xl mx-auto px-6 flex gap-1">
          <button
            onClick={() => setActiveTab("rsvps")}
            className={`font-body text-sm px-5 py-3 transition-colors ${
              activeTab === "rsvps"
                ? "bg-cream text-maroon rounded-t-lg font-semibold"
                : "text-cream-dark hover:text-white"
            }`}
          >
            RSVPs
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={`font-body text-sm px-5 py-3 transition-colors ${
              activeTab === "config"
                ? "bg-cream text-maroon rounded-t-lg font-semibold"
                : "text-cream-dark hover:text-white"
            }`}
          >
            Site Settings
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-deep-red/10 border border-deep-red/30 rounded-lg px-4 py-3 mb-6 text-deep-red font-body">
            {error}
          </div>
        )}

        {activeTab === "rsvps" ? (
          loading ? (
            <div className="text-center py-20">
              <p className="font-body text-charcoal/50 text-lg">
                Loading RSVPs...
              </p>
            </div>
          ) : (
            <>
              <StatsCards rsvps={rsvps} totalGuests={totalGuests} />
              <RsvpTable rsvps={rsvps} onDelete={handleDelete} />
            </>
          )
        ) : (
          <ConfigEditor onLogout={handleLogout} />
        )}
      </main>
    </div>
  );
}
