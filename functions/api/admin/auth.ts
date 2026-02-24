interface Env {
  ADMIN_PASSWORD: string;
}

async function createToken(password: string): Promise<string> {
  const payload = {
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + 86400, // 24 hour expiry
  };

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const payloadStr = JSON.stringify(payload);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadStr)
  );

  const payloadB64 = btoa(payloadStr);
  const signatureB64 = btoa(
    String.fromCharCode(...new Uint8Array(signature))
  );

  return `${payloadB64}.${signatureB64}`;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as Record<string, unknown>;
    const password =
      typeof body.password === "string" ? body.password : "";

    if (!password || password !== context.env.ADMIN_PASSWORD) {
      return Response.json(
        { success: false, error: "Invalid password" },
        { status: 401 }
      );
    }

    const token = await createToken(context.env.ADMIN_PASSWORD);

    return Response.json({ success: true, token });
  } catch (err) {
    console.error("Auth error:", err);
    return Response.json(
      { success: false, error: "Authentication failed" },
      { status: 500 }
    );
  }
};
