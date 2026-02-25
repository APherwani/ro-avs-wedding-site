import { createToken } from "../../../_shared/auth";

interface Env {
  ADMIN_PASSWORD: string;
  AUTH_SECRET: string;
}

// Legacy password login — kept as fallback during OAuth migration
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

    const token = await createToken(context.env.AUTH_SECRET);

    return Response.json({ success: true, token });
  } catch (err) {
    console.error("Auth error:", err);
    return Response.json(
      { success: false, error: "Authentication failed" },
      { status: 500 }
    );
  }
};
