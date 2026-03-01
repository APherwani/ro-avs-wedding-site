/**
 * Serves images from private R2 bucket.
 * Matches /api/images/gallery/uuid.jpg, /api/images/events/uuid.jpg, etc.
 * No public R2 URL needed — images are proxied through this function.
 */

interface Env {
  IMAGES: R2Bucket;
}

const VALID_FOLDERS = ["gallery", "events"];

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { path } = context.params;
  console.log("[images] GET /api/images/ — path segments:", path);
  console.log("[images] IMAGES binding present:", !!context.env.IMAGES);

  if (!Array.isArray(path) || path.length < 2) {
    console.log("[images] Rejected: invalid path segments");
    return new Response("Not found", { status: 404 });
  }

  const key = path.join("/");
  console.log("[images] Looking up R2 key:", key);

  // Only serve from known folders
  const isValidKey = VALID_FOLDERS.some((f) => key.startsWith(`${f}/`));
  if (!isValidKey) {
    console.log("[images] Rejected: key not in valid folder");
    return new Response("Not found", { status: 404 });
  }

  const object = await context.env.IMAGES.get(key);

  if (!object) {
    console.log("[images] R2 object not found for key:", key);
    return new Response("Not found", { status: 404 });
  }

  console.log("[images] Serving object:", key, "size:", object.size, "type:", object.httpMetadata?.contentType);

  const headers = new Headers();
  headers.set(
    "Content-Type",
    object.httpMetadata?.contentType || "application/octet-stream"
  );
  headers.set(
    "Cache-Control",
    object.httpMetadata?.cacheControl || "public, max-age=31536000, immutable"
  );
  // Allow browser caching with ETag
  headers.set("ETag", object.httpEtag);

  return new Response(object.body, { headers });
};
