import { requireAdmin } from "../_shared/auth";

interface Env {
  DB: D1Database;
  AUTH_SECRET: string;
}

const VALID_EVENTS = ["Mehendi", "Sangeet", "Wedding", "Reception"];
const VALID_GUEST_COUNTS = ["1", "2", "3", "4", "5+"];

// --- POST /api/rsvp - Submit an RSVP (public) ---

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as Record<string, unknown>;

    const errors: string[] = [];

    const fullName =
      typeof body.fullName === "string" ? body.fullName.trim() : "";
    if (!fullName) errors.push("Full name is required");
    if (fullName.length > 200)
      errors.push("Full name must be under 200 characters");

    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!email) errors.push("Email is required");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.push("Invalid email format");

    const numGuests =
      typeof body.numGuests === "string" ? body.numGuests : "";
    if (!VALID_GUEST_COUNTS.includes(numGuests))
      errors.push("Invalid number of guests");

    const events = Array.isArray(body.events) ? body.events : [];
    const validEvents = events.filter(
      (e): e is string => typeof e === "string" && VALID_EVENTS.includes(e)
    );
    if (validEvents.length === 0)
      errors.push("At least one event must be selected");

    const dietary =
      typeof body.dietary === "string"
        ? body.dietary.trim().slice(0, 1000)
        : "";
    const message =
      typeof body.message === "string"
        ? body.message.trim().slice(0, 2000)
        : "";

    if (errors.length > 0) {
      return Response.json(
        { success: false, error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    await context.env.DB.prepare(
      `INSERT INTO rsvps (full_name, email, num_guests, events, dietary, message)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(fullName, email, numGuests, JSON.stringify(validEvents), dietary, message)
      .run();

    return Response.json(
      { success: true, message: "RSVP received successfully" },
      { status: 201 }
    );
  } catch (err) {
    console.error("RSVP submission error:", err);
    return Response.json(
      { success: false, error: "Failed to save RSVP. Please try again." },
      { status: 500 }
    );
  }
};

// --- GET /api/rsvp - List all RSVPs (admin only) ---

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const authError = await requireAdmin(
    context.request,
    context.env.AUTH_SECRET
  );
  if (authError) return authError;

  try {
    const result = await context.env.DB.prepare(
      "SELECT * FROM rsvps ORDER BY created_at DESC"
    ).all();

    const rsvps = (result.results || []).map((row: Record<string, unknown>) => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      numGuests: row.num_guests,
      events: JSON.parse(row.events as string),
      dietary: row.dietary,
      message: row.message,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    let totalGuests = 0;
    for (const r of rsvps) {
      const n = r.numGuests === "5+" ? 5 : parseInt(r.numGuests as string, 10);
      totalGuests += isNaN(n) ? 0 : n;
    }

    return Response.json({
      success: true,
      rsvps,
      total: rsvps.length,
      totalGuests,
    });
  } catch (err) {
    console.error("RSVP list error:", err);
    return Response.json(
      { success: false, error: "Failed to fetch RSVPs" },
      { status: 500 }
    );
  }
};

// --- DELETE /api/rsvp?id=N - Delete an RSVP (admin only) ---

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const authError = await requireAdmin(
    context.request,
    context.env.AUTH_SECRET
  );
  if (authError) return authError;

  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");

    if (!id || isNaN(Number(id))) {
      return Response.json(
        { success: false, error: "Invalid RSVP ID" },
        { status: 400 }
      );
    }

    await context.env.DB.prepare("DELETE FROM rsvps WHERE id = ?")
      .bind(Number(id))
      .run();

    return Response.json({ success: true, message: "RSVP deleted" });
  } catch (err) {
    console.error("RSVP delete error:", err);
    return Response.json(
      { success: false, error: "Failed to delete RSVP" },
      { status: 500 }
    );
  }
};
