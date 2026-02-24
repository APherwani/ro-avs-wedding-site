"use client";

import { useState, useEffect, useCallback } from "react";
import type { SiteConfig, EventConfig } from "@/config/types";
import { defaultConfig } from "@/config/content";

interface RsvpEntry {
  id: number;
  fullName: string;
  email: string;
  numGuests: string;
  events: string[];
  dietary: string;
  message: string;
  createdAt: string;
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

// --- Login Form ---

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Invalid password");
        return;
      }

      setToken(data.token);
      onLogin();
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-maroon text-center mb-8">
          Admin Login
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
            className="w-full border border-gold/30 rounded-lg px-4 py-3 font-body text-lg text-charcoal bg-white focus:outline-none focus:border-gold transition-colors"
          />
          {error && (
            <p className="text-deep-red font-body text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-maroon text-gold font-display text-lg font-bold py-3 rounded-lg hover:bg-maroon-dark transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
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
      {["Mehendi", "Sangeet", "Wedding", "Reception"].map((event) => (
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
          <option value="Mehendi">Mehendi</option>
          <option value="Sangeet">Sangeet</option>
          <option value="Wedding">Wedding</option>
          <option value="Reception">Reception</option>
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
                    {r.fullName}
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
                    {confirmDelete === r.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            onDelete(r.id);
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
                        onClick={() => setConfirmDelete(r.id)}
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

// --- Image upload helper ---

async function uploadImage(
  file: File,
  folder: "gallery" | "events"
): Promise<{ success: boolean; url?: string; error?: string }> {
  const token = getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: "File too large (max 10MB)" };
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return await res.json();
  } catch {
    return { success: false, error: "Upload failed" };
  }
}

async function deleteImage(url: string): Promise<void> {
  const token = getToken();
  if (!token) return;

  // Extract key: last 2 path segments (e.g. "gallery/uuid.jpg")
  const parts = new URL(url).pathname.split("/");
  const key = parts.slice(-2).join("/");

  await fetch(`/api/upload?key=${encodeURIComponent(key)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
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

  // Event drag state
  const [eventDragIdx, setEventDragIdx] = useState<number | null>(null);
  const [eventDropIdx, setEventDropIdx] = useState<number | null>(null);

  // Gallery drag state
  const [galleryDragIdx, setGalleryDragIdx] = useState<number | null>(null);
  const [galleryDropIdx, setGalleryDropIdx] = useState<number | null>(null);
  const [galleryUploading, setGalleryUploading] = useState(false);

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

  // --- Event image upload ---

  const handleEventImageUpload = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const result = await uploadImage(file, "events");
    if (result.success && result.url) {
      updateEvent(index, "image", result.url);
    } else {
      setMessage({ type: "error", text: result.error || "Upload failed" });
    }
  };

  const handleRemoveEventImage = async (index: number) => {
    const url = config.events[index]?.image;
    if (url) {
      await deleteImage(url);
    }
    updateEvent(index, "image", "");
  };

  // --- Gallery handlers ---

  const handleGalleryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    e.target.value = "";
    setGalleryUploading(true);

    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const result = await uploadImage(file, "gallery");
      if (result.success && result.url) {
        newUrls.push(result.url);
      }
    }

    if (newUrls.length > 0) {
      setConfig((prev) => ({
        ...prev,
        gallery: [...prev.gallery, ...newUrls],
      }));
    }
    setGalleryUploading(false);
  };

  const removeGalleryImage = async (index: number) => {
    const url = config.gallery[index];
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

  return (
    <div className="space-y-8">
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
            disabled={saving}
            className="font-body text-sm px-6 py-2 rounded-lg bg-maroon text-gold font-semibold hover:bg-maroon-dark transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
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
            <label className={labelClass}>Bride Name</label>
            <input
              className={inputClass}
              value={config.couple.bride}
              onChange={(e) => updateCouple("bride", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Groom Name</label>
            <input
              className={inputClass}
              value={config.couple.groom}
              onChange={(e) => updateCouple("groom", e.target.value)}
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
                  {event.image ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={event.image}
                        alt={event.name}
                        className="w-24 h-16 object-cover rounded border border-gold/20"
                      />
                      <div className="flex gap-2">
                        <label className="text-xs text-gold hover:text-gold-dark font-body cursor-pointer">
                          Change
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleEventImageUpload(i, e)}
                          />
                        </label>
                        <button
                          onClick={() => handleRemoveEventImage(i)}
                          className="text-xs text-deep-red/70 hover:text-deep-red font-body"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-2 border border-dashed border-gold/30 rounded-lg px-4 py-2 cursor-pointer hover:bg-gold/5 transition-colors">
                      <span className="font-body text-sm text-charcoal/50">
                        Upload Image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleEventImageUpload(i, e)}
                      />
                    </label>
                  )}
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
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
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
                  className={`relative aspect-square rounded-lg overflow-hidden group cursor-grab active:cursor-grabbing border-2 transition-all ${
                    galleryDropIdx === i && galleryDragIdx !== i
                      ? "border-gold"
                      : "border-transparent"
                  } ${galleryDragIdx === i ? "opacity-40" : ""}`}
                >
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

  // Check for existing session on mount
  useEffect(() => {
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
    return <LoginForm onLogin={() => setAuthed(true)} />;
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
