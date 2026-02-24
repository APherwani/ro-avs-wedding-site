import { requireAdmin } from "../_shared/auth";

interface Env {
  IMAGES: R2Bucket;
  ADMIN_PASSWORD: string;
  R2_PUBLIC_URL: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const VALID_FOLDERS = ["gallery", "events"];

// --- POST /api/upload - Upload image to R2 (admin only) ---

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const authError = await requireAdmin(
    context.request,
    context.env.ADMIN_PASSWORD
  );
  if (authError) return authError;

  if (!context.env.R2_PUBLIC_URL) {
    return Response.json(
      {
        success: false,
        error:
          "R2_PUBLIC_URL environment variable is not configured. Set it in Cloudflare Pages settings.",
      },
      { status: 500 }
    );
  }

  try {
    const formData = await context.request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder");

    if (!file || !(file instanceof File)) {
      return Response.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (typeof folder !== "string" || !VALID_FOLDERS.includes(folder)) {
      return Response.json(
        { success: false, error: "Invalid folder. Must be 'gallery' or 'events'" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { success: false, error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return Response.json(
        {
          success: false,
          error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF.",
        },
        { status: 400 }
      );
    }

    const key = `${folder}/${crypto.randomUUID()}.${ext}`;

    await context.env.IMAGES.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
        cacheControl: "public, max-age=31536000, immutable",
      },
    });

    const publicUrl = context.env.R2_PUBLIC_URL.replace(/\/$/, "");
    const url = `${publicUrl}/${key}`;

    return Response.json({ success: true, key, url }, { status: 201 });
  } catch (err) {
    console.error("Upload error:", err);
    return Response.json(
      { success: false, error: "Failed to upload image" },
      { status: 500 }
    );
  }
};

// --- DELETE /api/upload?key=... - Delete image from R2 (admin only) ---

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const authError = await requireAdmin(
    context.request,
    context.env.ADMIN_PASSWORD
  );
  if (authError) return authError;

  try {
    const url = new URL(context.request.url);
    const key = url.searchParams.get("key");

    if (!key) {
      return Response.json(
        { success: false, error: "Missing key parameter" },
        { status: 400 }
      );
    }

    // Only allow deleting from known folders
    const isValidKey = VALID_FOLDERS.some((f) => key.startsWith(`${f}/`));
    if (!isValidKey) {
      return Response.json(
        { success: false, error: "Invalid key" },
        { status: 400 }
      );
    }

    await context.env.IMAGES.delete(key);

    return Response.json({ success: true, message: "Image deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    return Response.json(
      { success: false, error: "Failed to delete image" },
      { status: 500 }
    );
  }
};
