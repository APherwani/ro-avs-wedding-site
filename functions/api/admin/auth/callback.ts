import { createToken } from "../../../_shared/auth";

interface Env {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  ALLOWED_ADMIN_EMAILS: string;
  AUTH_SECRET: string;
}

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
}

interface GoogleUserInfo {
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const pair of cookieHeader.split(";")) {
    const [key, ...rest] = pair.split("=");
    if (key) {
      cookies[key.trim()] = rest.join("=").trim();
    }
  }
  return cookies;
}

function errorRedirect(origin: string, code: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${origin}/admin#error=${code}`,
      "Set-Cookie": "oauth_state=; HttpOnly; Max-Age=0; Path=/api/admin/auth",
    },
  });
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Handle user denying consent
  if (error) {
    return errorRedirect(origin, "access_denied");
  }

  if (!code || !state) {
    return errorRedirect(origin, "missing_params");
  }

  // Verify CSRF state
  const cookies = parseCookies(context.request.headers.get("Cookie") || "");
  const savedState = cookies["oauth_state"];
  if (!savedState || savedState !== state) {
    return errorRedirect(origin, "invalid_state");
  }

  // Exchange authorization code for tokens
  const redirectUri = `${origin}/api/admin/auth/callback`;
  let tokenData: GoogleTokenResponse;

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: context.env.GOOGLE_CLIENT_ID,
        client_secret: context.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", await tokenResponse.text());
      return errorRedirect(origin, "token_exchange_failed");
    }

    tokenData = (await tokenResponse.json()) as GoogleTokenResponse;
  } catch (err) {
    console.error("Token exchange error:", err);
    return errorRedirect(origin, "token_exchange_failed");
  }

  // Get user info from Google
  let userInfo: GoogleUserInfo;

  try {
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );

    if (!userInfoResponse.ok) {
      console.error("Userinfo fetch failed:", await userInfoResponse.text());
      return errorRedirect(origin, "userinfo_failed");
    }

    userInfo = (await userInfoResponse.json()) as GoogleUserInfo;
  } catch (err) {
    console.error("Userinfo error:", err);
    return errorRedirect(origin, "userinfo_failed");
  }

  if (!userInfo.email_verified) {
    return errorRedirect(origin, "email_not_verified");
  }

  // Check whitelist
  const allowedEmails = context.env.ALLOWED_ADMIN_EMAILS
    .split(",")
    .map((e) => e.trim().toLowerCase());

  if (!allowedEmails.includes(userInfo.email.toLowerCase())) {
    console.log("Unauthorized email attempted login:", userInfo.email);
    return errorRedirect(origin, "not_authorized");
  }

  // Create session token (same HMAC-SHA256 format used by all protected endpoints)
  const token = await createToken(context.env.AUTH_SECRET);

  // Clear the oauth_state cookie and redirect with token in hash
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${origin}/admin#token=${token}`,
      "Set-Cookie": "oauth_state=; HttpOnly; Max-Age=0; Path=/api/admin/auth",
    },
  });
};
