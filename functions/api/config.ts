import { requireAdmin } from "../_shared/auth";

interface Env {
  DB: D1Database;
  AUTH_SECRET: string;
}

// --- GET /api/config - Public, returns site config ---

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const row = await context.env.DB.prepare(
      "SELECT config FROM site_config WHERE id = 1"
    ).first<{ config: string }>();

    if (!row) {
      return Response.json({ success: true, config: null });
    }

    return Response.json({
      success: true,
      config: JSON.parse(row.config),
    });
  } catch (err) {
    console.error("Config fetch error:", err);
    return Response.json(
      { success: false, error: "Failed to fetch config" },
      { status: 500 }
    );
  }
};

// --- PUT /api/config - Admin only, updates site config ---

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const authError = await requireAdmin(
    context.request,
    context.env.AUTH_SECRET
  );
  if (authError) return authError;

  try {
    const body = (await context.request.json()) as { config: unknown };

    if (!body.config || typeof body.config !== "object") {
      return Response.json(
        { success: false, error: "Invalid config format" },
        { status: 400 }
      );
    }

    const configStr = JSON.stringify(body.config);

    await context.env.DB.prepare(
      `INSERT INTO site_config (id, config, updated_at)
       VALUES (1, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET config = excluded.config, updated_at = datetime('now')`
    )
      .bind(configStr)
      .run();

    return Response.json({ success: true, message: "Config saved" });
  } catch (err) {
    console.error("Config save error:", err);
    return Response.json(
      { success: false, error: "Failed to save config" },
      { status: 500 }
    );
  }
};
