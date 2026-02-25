interface Env {
  GOOGLE_CLIENT_ID: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const state = crypto.randomUUID();
  const origin = new URL(context.request.url).origin;
  const redirectUri = `${origin}/api/admin/auth/callback`;

  const params = new URLSearchParams({
    client_id: context.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  // Set HttpOnly cookie for CSRF state verification
  const isLocal = origin.startsWith("http://localhost");
  const cookieFlags = `HttpOnly; SameSite=Lax; Max-Age=600; Path=/api/admin/auth${isLocal ? "" : "; Secure"}`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: googleAuthUrl,
      "Set-Cookie": `oauth_state=${state}; ${cookieFlags}`,
    },
  });
};
