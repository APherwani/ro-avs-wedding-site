import { requireAdmin } from "../_shared/auth";

interface Env {
  IMAGES: R2Bucket;
  AUTH_SECRET: string;
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
  console.log("[upload] POST /api/upload - start");
  console.log("[upload] AUTH_SECRET present:", !!context.env.AUTH_SECRET);
  console.log("[upload] IMAGES binding present:", !!context.env.IMAGES);

  const authError = await requireAdmin(
    context.request,
    context.env.AUTH_SECRET
  );
  if (authError) {
    console.log("[upload] Auth check failed — returning 401");
    return authError;
  }
  console.log("[upload] Auth check passed");

  try {
    const formData = await context.request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder");

    const isFile = typeof file === "object" && file !== null && "name" in file;
    console.log("[upload] FormData parsed — file:", isFile ? `${(file as File).name} (${(file as File).size} bytes, ${(file as File).type})` : String(file));
    console.log("[upload] folder:", folder);

    if (!file || !isFile) {
      console.log("[upload] Rejected: no file or not a File instance, got:", typeof file);
      return Response.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const uploadFile = file as File;

    if (typeof folder !== "string" || !VALID_FOLDERS.includes(folder)) {
      console.log("[upload] Rejected: invalid folder value:", folder);
      return Response.json(
        { success: false, error: "Invalid folder. Must be 'gallery' or 'events'" },
        { status: 400 }
      );
    }

    if (uploadFile.size > MAX_FILE_SIZE) {
      console.log("[upload] Rejected: file too large:", uploadFile.size);
      return Response.json(
        { success: false, error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const ext = ALLOWED_TYPES[uploadFile.type];
    if (!ext) {
      console.log("[upload] Rejected: invalid file type:", uploadFile.type);
      return Response.json(
        {
          success: false,
          error: `Invalid file type '${uploadFile.type}'. Allowed: JPEG, PNG, WebP, GIF.`,
        },
        { status: 400 }
      );
    }

    const key = `${folder}/${crypto.randomUUID()}.${ext}`;
    console.log("[upload] Putting to R2 with key:", key);

    await context.env.IMAGES.put(key, uploadFile.stream(), {
      httpMetadata: {
        contentType: uploadFile.type,
        cacheControl: "public, max-age=31536000, immutable",
      },
    });
    console.log("[upload] R2 put succeeded");

    // Serve through our own /api/images/ proxy — no public R2 URL needed
    const url = `/api/images/${key}`;

    console.log("[upload] Success — returning url:", url);
    return Response.json({ success: true, key, url }, { status: 201 });
  } catch (err) {
    console.error("[upload] Unhandled error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return Response.json(
      { success: false, error: `Failed to upload image: ${message}` },
      { status: 500 }
    );
  }
};

// --- DELETE /api/upload?key=... - Delete image from R2 (admin only) ---

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  console.log("[upload] DELETE /api/upload - start");

  const authError = await requireAdmin(
    context.request,
    context.env.AUTH_SECRET
  );
  if (authError) {
    console.log("[upload] DELETE auth check failed");
    return authError;
  }
  console.log("[upload] DELETE auth check passed");

  try {
    const url = new URL(context.request.url);
    const key = url.searchParams.get("key");
    console.log("[upload] DELETE key:", key);

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
    console.log("[upload] DELETE succeeded for key:", key);

    return Response.json({ success: true, message: "Image deleted" });
  } catch (err) {
    console.error("[upload] DELETE error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return Response.json(
      { success: false, error: `Failed to delete image: ${message}` },
      { status: 500 }
    );
  }
};
