import { requireAdmin } from "../_shared/auth";

interface Env {
  DB: D1Database;
  AUTH_SECRET: string;
  IMAGES?: R2Bucket;
  RESEND_API_KEY?: string;
  RSVP_NOTIFY_TO?: string;
  RSVP_NOTIFY_FROM?: string;
  RSVP_NOTIFY_REPLY_TO?: string;
  RSVP_NOTIFY_SUBJECT_PREFIX?: string;
  ALLOWED_ADMIN_EMAILS?: string;
}

const FALLBACK_EVENTS = [
  "Mehendi",
  "Sangeet",
  "Wedding Ceremony",
  "Reception",
];
const VALID_GUEST_COUNTS = ["1", "2", "3", "4", "5+"];
const VALID_GUEST_COUNT_SET: ReadonlySet<string> = new Set(VALID_GUEST_COUNTS);

const MAX_REQUEST_BODY_BYTES = 16 * 1024;
const MAX_FULL_NAME_LENGTH = 200;
const MAX_EMAIL_LENGTH = 254;
const MAX_DIETARY_LENGTH = 1000;
const MAX_MESSAGE_LENGTH = 2000;
const RSVP_BACKUP_PREFIX = "rsvp-backups/submissions/";

const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const SINGLE_LINE_CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/g;
const MULTI_LINE_CONTROL_CHARS =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

type RsvpInput = {
  fullName: string;
  email: string;
  numGuests: string;
  events: string[];
  dietary: string;
  message: string;
};

type PublicRsvpEntry = {
  id: number | string;
  fullName: string;
  email: string;
  numGuests: string;
  events: string[];
  dietary: string;
  message: string;
  createdAt: string;
  updatedAt?: string;
  source?: "database" | "backup";
  backupOnly?: boolean;
};

type RsvpBackupRecord = {
  version: 1;
  submissionId: string;
  submittedAt: string;
  dbSaved: boolean;
  dbRowId?: number;
  dbError?: string;
  deletedAt?: string;
  rsvp: RsvpInput;
};

function jsonError(status: number, error: string, details?: string[]) {
  return Response.json(
    { success: false, error, ...(details ? { details } : {}) },
    { status }
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJsonBody(
  request: Request
): Promise<{ body?: Record<string, unknown>; response?: Response }> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return {
      response: jsonError(415, "Content-Type must be application/json"),
    };
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const parsedLength = Number(contentLength);
    if (
      !Number.isFinite(parsedLength) ||
      parsedLength < 0 ||
      parsedLength > MAX_REQUEST_BODY_BYTES
    ) {
      return { response: jsonError(413, "RSVP request is too large") };
    }
  }

  const rawBody = await readBodyWithLimit(request);
  if (rawBody.response) return { response: rawBody.response };

  try {
    const parsed = JSON.parse(rawBody.text || "");
    if (!isRecord(parsed)) {
      return { response: jsonError(400, "RSVP payload must be an object") };
    }
    return { body: parsed };
  } catch {
    return { response: jsonError(400, "Invalid JSON payload") };
  }
}

async function readBodyWithLimit(
  request: Request
): Promise<{ text?: string; response?: Response }> {
  const reader = request.body?.getReader();
  if (!reader) return { text: "" };

  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    receivedBytes += value.byteLength;
    if (receivedBytes > MAX_REQUEST_BODY_BYTES) {
      return { response: jsonError(413, "RSVP request is too large") };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(receivedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { text: new TextDecoder().decode(bytes) };
}

function normalizeSingleLine(value: string) {
  return value
    .normalize("NFKC")
    .replace(SINGLE_LINE_CONTROL_CHARS, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeMultiLine(value: string) {
  return value
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(MULTI_LINE_CONTROL_CHARS, "")
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function validateTextField(
  body: Record<string, unknown>,
  key: string,
  label: string,
  maxLength: number,
  errors: string[],
  options: { required: boolean; multiline?: boolean }
) {
  const rawValue = body[key];

  if (rawValue === undefined || rawValue === null || rawValue === "") {
    if (options.required) errors.push(`${label} is required`);
    return "";
  }

  if (typeof rawValue !== "string") {
    errors.push(`${label} must be text`);
    return "";
  }

  const normalized = options.multiline
    ? normalizeMultiLine(rawValue)
    : normalizeSingleLine(rawValue);

  if (!normalized) {
    if (options.required) errors.push(`${label} is required`);
    return "";
  }

  if (normalized.length > maxLength) {
    errors.push(`${label} must be under ${maxLength} characters`);
  }

  return normalized;
}

function getUniqueEventNames(events: unknown) {
  if (!Array.isArray(events)) return [];

  const seen = new Set<string>();
  const names: string[] = [];

  for (const event of events) {
    if (!isRecord(event) || typeof event.name !== "string") continue;

    const name = normalizeSingleLine(event.name);
    if (!name || seen.has(name)) continue;

    seen.add(name);
    names.push(name);
  }

  return names;
}

async function getAllowedEventNames(env: Env) {
  try {
    const row = await env.DB.prepare(
      "SELECT config FROM site_config WHERE id = 1"
    ).first<{ config: string }>();

    if (!row) return FALLBACK_EVENTS;

    const parsed = JSON.parse(row.config);
    if (!isRecord(parsed)) return FALLBACK_EVENTS;

    const configuredEvents = getUniqueEventNames(parsed.events);
    return configuredEvents.length > 0 ? configuredEvents : FALLBACK_EVENTS;
  } catch (err) {
    console.error("Could not load RSVP event options:", err);
    return FALLBACK_EVENTS;
  }
}

function validateEvents(
  value: unknown,
  errors: string[],
  allowedEvents: string[]
) {
  if (!Array.isArray(value)) {
    errors.push("At least one event must be selected");
    return [];
  }

  if (value.length > allowedEvents.length) {
    errors.push("Too many event selections");
  }

  const validEventSet = new Set(allowedEvents);
  const selectedEvents = new Set<string>();
  let hasInvalidEvent = false;

  for (const event of value) {
    if (typeof event !== "string" || !validEventSet.has(event)) {
      hasInvalidEvent = true;
      continue;
    }
    selectedEvents.add(event);
  }

  if (hasInvalidEvent) {
    errors.push("Invalid event selection");
  }
  if (selectedEvents.size === 0) {
    errors.push("At least one event must be selected");
  }

  return allowedEvents.filter((event) => selectedEvents.has(event));
}

function validateRsvpInput(
  body: Record<string, unknown>,
  allowedEvents: string[]
) {
  const errors: string[] = [];

  const fullName = validateTextField(
    body,
    "fullName",
    "Full name",
    MAX_FULL_NAME_LENGTH,
    errors,
    { required: true }
  );

  const email = validateTextField(
    body,
    "email",
    "Email",
    MAX_EMAIL_LENGTH,
    errors,
    { required: true }
  ).toLowerCase();
  if (email && !EMAIL_PATTERN.test(email)) {
    errors.push("Invalid email format");
  }

  const numGuests =
    typeof body.numGuests === "string" ? normalizeSingleLine(body.numGuests) : "";
  if (!VALID_GUEST_COUNT_SET.has(numGuests)) {
    errors.push("Invalid number of guests");
  }

  const events = validateEvents(body.events, errors, allowedEvents);

  const dietary = validateTextField(
    body,
    "dietary",
    "Dietary requirements",
    MAX_DIETARY_LENGTH,
    errors,
    { required: false, multiline: true }
  );

  const message = validateTextField(
    body,
    "message",
    "Message",
    MAX_MESSAGE_LENGTH,
    errors,
    { required: false, multiline: true }
  );

  return {
    value: { fullName, email, numGuests, events, dietary, message } as RsvpInput,
    errors,
  };
}

function parseRsvpId(value: string | null) {
  if (!value || !/^[1-9]\d{0,15}$/.test(value)) return null;

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function getErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

function getRsvpSignature(rsvp: RsvpInput) {
  return JSON.stringify([
    rsvp.fullName,
    rsvp.email,
    rsvp.numGuests,
    rsvp.events,
    rsvp.dietary,
    rsvp.message,
  ]);
}

function rowToRsvpInput(row: Record<string, unknown>): RsvpInput {
  return {
    fullName: String(row.full_name || ""),
    email: String(row.email || ""),
    numGuests: String(row.num_guests || ""),
    events: parseEvents(row.events),
    dietary: String(row.dietary || ""),
    message: String(row.message || ""),
  };
}

function parseEvents(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((event): event is string => typeof event === "string");
  }

  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((event): event is string => typeof event === "string")
      : [];
  } catch {
    return [];
  }
}

function rowToPublicRsvp(row: Record<string, unknown>): PublicRsvpEntry {
  return {
    id: Number(row.id),
    ...rowToRsvpInput(row),
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || ""),
    source: "database",
  };
}

function backupToPublicRsvp(
  record: RsvpBackupRecord,
  backupOnly = true
): PublicRsvpEntry {
  return {
    id: `backup:${record.submissionId}`,
    ...record.rsvp,
    createdAt: record.submittedAt,
    updatedAt: record.submittedAt,
    source: "backup",
    backupOnly,
  };
}

function getBackupKey(submittedAt: string, submissionId: string) {
  const day = submittedAt.slice(0, 10);
  const timestamp = submittedAt.replace(/[:.]/g, "-");
  return `${RSVP_BACKUP_PREFIX}${day}/${timestamp}-${submissionId}.json`;
}

function buildBackupRecord(
  rsvp: RsvpInput,
  submissionId: string,
  submittedAt: string
): RsvpBackupRecord {
  return {
    version: 1,
    submissionId,
    submittedAt,
    dbSaved: false,
    rsvp,
  };
}

async function putRsvpBackup(
  env: Env,
  key: string,
  record: RsvpBackupRecord
) {
  if (!env.IMAGES) {
    return { ok: false, error: "R2 backup binding is not configured" };
  }

  try {
    await env.IMAGES.put(key, JSON.stringify(record, null, 2), {
      httpMetadata: {
        contentType: "application/json; charset=utf-8",
        cacheControl: "no-store",
      },
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: getErrorMessage(err) };
  }
}

function isBackupRecord(value: unknown): value is RsvpBackupRecord {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.rsvp)) {
    return false;
  }

  return (
    typeof value.submissionId === "string" &&
    typeof value.submittedAt === "string" &&
    typeof value.dbSaved === "boolean" &&
    typeof value.rsvp.fullName === "string" &&
    typeof value.rsvp.email === "string" &&
    typeof value.rsvp.numGuests === "string" &&
    Array.isArray(value.rsvp.events) &&
    value.rsvp.events.every((event) => typeof event === "string") &&
    typeof value.rsvp.dietary === "string" &&
    typeof value.rsvp.message === "string"
  );
}

async function listRsvpBackups(env: Env) {
  const records: RsvpBackupRecord[] = [];

  if (!env.IMAGES) {
    return { records, warning: "R2 backup binding is not configured" };
  }

  let cursor: string | undefined;

  try {
    do {
      const listed = await env.IMAGES.list({
        prefix: RSVP_BACKUP_PREFIX,
        cursor,
        limit: 1000,
      });

      cursor = listed.truncated ? listed.cursor : undefined;

      for (const object of listed.objects) {
        const backupObject = await env.IMAGES.get(object.key);
        if (!backupObject) continue;

        try {
          const parsed = JSON.parse(await backupObject.text());
          if (isBackupRecord(parsed) && !parsed.deletedAt) {
            records.push(parsed);
          }
        } catch (err) {
          console.error("Skipping invalid RSVP backup:", object.key, err);
        }
      }
    } while (cursor);
  } catch (err) {
    return { records, warning: `R2 backup list failed: ${getErrorMessage(err)}` };
  }

  records.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  return { records };
}

function mergeDatabaseAndBackupRsvps(
  databaseRsvps: PublicRsvpEntry[],
  backupRecords: RsvpBackupRecord[]
) {
  const databaseSignatures = new Set(
    databaseRsvps.map((rsvp) =>
      getRsvpSignature({
        fullName: rsvp.fullName,
        email: rsvp.email,
        numGuests: rsvp.numGuests,
        events: rsvp.events,
        dietary: rsvp.dietary,
        message: rsvp.message,
      })
    )
  );

  const backupOnlyRsvps = backupRecords
    .filter((record) => !databaseSignatures.has(getRsvpSignature(record.rsvp)))
    .map((record) => backupToPublicRsvp(record));

  return [...backupOnlyRsvps, ...databaseRsvps].sort((a, b) =>
    String(b.createdAt).localeCompare(String(a.createdAt))
  );
}

function getTotalGuests(rsvps: PublicRsvpEntry[]) {
  let totalGuests = 0;
  for (const r of rsvps) {
    const n = r.numGuests === "5+" ? 5 : parseInt(r.numGuests, 10);
    totalGuests += isNaN(n) ? 0 : n;
  }
  return totalGuests;
}

function splitEmailList(value: string | undefined) {
  return (value || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function formatRsvpText(record: RsvpBackupRecord) {
  const { rsvp } = record;
  return [
    `New RSVP for Ro & Avs`,
    ``,
    `Name: ${rsvp.fullName}`,
    `Email: ${rsvp.email}`,
    `Guests: ${rsvp.numGuests}`,
    `Events: ${rsvp.events.join(", ")}`,
    `Dietary: ${rsvp.dietary || "None provided"}`,
    `Message: ${rsvp.message || "None provided"}`,
    ``,
    `Submitted: ${record.submittedAt}`,
    `Submission ID: ${record.submissionId}`,
    `Database saved: ${record.dbSaved ? "Yes" : "No"}`,
    record.dbError ? `Database error: ${record.dbError}` : "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function formatRsvpHtml(record: RsvpBackupRecord) {
  const { rsvp } = record;
  const rows = [
    ["Name", rsvp.fullName],
    ["Email", rsvp.email],
    ["Guests", rsvp.numGuests],
    ["Events", rsvp.events.join(", ")],
    ["Dietary", rsvp.dietary || "None provided"],
    ["Message", rsvp.message || "None provided"],
    ["Submitted", record.submittedAt],
    ["Submission ID", record.submissionId],
    ["Database saved", record.dbSaved ? "Yes" : "No"],
  ];

  if (record.dbError) rows.push(["Database error", record.dbError]);

  return `
    <h2>New RSVP for Ro &amp; Avs</h2>
    <table cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
      ${rows
        .map(
          ([label, value]) => `
            <tr>
              <th align="left" style="border-bottom: 1px solid #ddd;">${escapeHtml(label)}</th>
              <td style="border-bottom: 1px solid #ddd;">${escapeHtml(value)}</td>
            </tr>`
        )
        .join("")}
    </table>
  `;
}

async function sendRsvpNotification(env: Env, record: RsvpBackupRecord) {
  const recipients = splitEmailList(env.RSVP_NOTIFY_TO || env.ALLOWED_ADMIN_EMAILS);
  const from = env.RSVP_NOTIFY_FROM;

  if (!env.RESEND_API_KEY || !from || recipients.length === 0) {
    console.warn(
      "RSVP email notification skipped. Set RESEND_API_KEY, RSVP_NOTIFY_FROM, and RSVP_NOTIFY_TO."
    );
    return;
  }

  const subjectPrefix = env.RSVP_NOTIFY_SUBJECT_PREFIX || "Wedding RSVP";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: recipients,
      reply_to: env.RSVP_NOTIFY_REPLY_TO || record.rsvp.email,
      subject: `${subjectPrefix}: ${record.rsvp.fullName}`,
      text: formatRsvpText(record),
      html: formatRsvpHtml(record),
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend returned ${response.status}: ${await response.text()}`);
  }
}

function notifyOrganizers(context: EventContext<Env, string, unknown>, record: RsvpBackupRecord) {
  context.waitUntil(
    sendRsvpNotification(context.env, record).catch((err) => {
      console.error("RSVP notification email failed:", err);
    })
  );
}

async function markMatchingBackupsDeleted(
  env: Env,
  deletedRsvp: RsvpInput,
  deletedAt: string
) {
  const backups = await listRsvpBackups(env);
  if (backups.warning) {
    console.warn("Could not mark RSVP backup deleted:", backups.warning);
    return;
  }

  const signature = getRsvpSignature(deletedRsvp);
  for (const record of backups.records) {
    if (getRsvpSignature(record.rsvp) !== signature) continue;

    const key = getBackupKey(record.submittedAt, record.submissionId);
    const result = await putRsvpBackup(env, key, { ...record, deletedAt });
    if (!result.ok) {
      console.warn("Could not mark RSVP backup deleted:", key, result.error);
    }
  }
}

// --- POST /api/rsvp - Submit an RSVP (public) ---

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const parsedBody = await readJsonBody(context.request);
    if (parsedBody.response) return parsedBody.response;

    const allowedEvents = await getAllowedEventNames(context.env);
    const { value, errors } = validateRsvpInput(
      parsedBody.body || {},
      allowedEvents
    );

    if (errors.length > 0) {
      return jsonError(400, "Validation failed", errors);
    }

    const { fullName, email, numGuests, events, dietary, message } = value;
    const submissionId = crypto.randomUUID();
    const submittedAt = new Date().toISOString();
    const backupKey = getBackupKey(submittedAt, submissionId);
    const backupRecord = buildBackupRecord(value, submissionId, submittedAt);
    const initialBackup = await putRsvpBackup(
      context.env,
      backupKey,
      backupRecord
    );

    if (!initialBackup.ok) {
      console.error("Initial RSVP backup failed:", initialBackup.error);
    }

    // D1 prepared statements with bound values are the SQL injection boundary.
    let dbSaved = false;
    let dbRowId: number | undefined;
    let dbError: string | undefined;

    try {
      const insertResult = await context.env.DB.prepare(
        `INSERT INTO rsvps (full_name, email, num_guests, events, dietary, message)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind(fullName, email, numGuests, JSON.stringify(events), dietary, message)
        .run();

      const insertMeta = insertResult.meta as
        | { last_row_id?: number | string }
        | undefined;
      const lastRowId = Number(insertMeta?.last_row_id);
      dbRowId = Number.isSafeInteger(lastRowId) ? lastRowId : undefined;
      dbSaved = true;
    } catch (err) {
      dbError = getErrorMessage(err);
      console.error("RSVP D1 insert failed:", err);
    }

    const finalBackupRecord: RsvpBackupRecord = {
      ...backupRecord,
      dbSaved,
      ...(dbRowId !== undefined ? { dbRowId } : {}),
      ...(dbError ? { dbError } : {}),
    };

    const finalBackup = await putRsvpBackup(
      context.env,
      backupKey,
      finalBackupRecord
    );
    if (!finalBackup.ok) {
      console.error("Final RSVP backup failed:", finalBackup.error);
    }

    if (!dbSaved && !initialBackup.ok && !finalBackup.ok) {
      return Response.json(
        {
          success: false,
          error: "Failed to save RSVP. Please try again.",
        },
        { status: 500 }
      );
    }

    notifyOrganizers(context, finalBackupRecord);

    return Response.json(
      {
        success: true,
        message: "RSVP received successfully",
        backupOnly: !dbSaved,
      },
      { status: dbSaved ? 201 : 202 }
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

    const databaseRsvps = (result.results || []).map((row: Record<string, unknown>) =>
      rowToPublicRsvp(row)
    );
    const backups = await listRsvpBackups(context.env);
    if (backups.warning) console.warn(backups.warning);

    const rsvps = mergeDatabaseAndBackupRsvps(databaseRsvps, backups.records);

    return Response.json({
      success: true,
      rsvps,
      total: rsvps.length,
      totalGuests: getTotalGuests(rsvps),
      backupCount: backups.records.length,
      backupWarning: backups.warning,
    });
  } catch (err) {
    console.error("RSVP list error:", err);

    const backups = await listRsvpBackups(context.env);
    if (backups.records.length > 0) {
      const rsvps = backups.records.map((record) =>
        backupToPublicRsvp(record, true)
      );
      return Response.json({
        success: true,
        rsvps,
        total: rsvps.length,
        totalGuests: getTotalGuests(rsvps),
        source: "backup",
        warning:
          "Database is unavailable. Showing RSVP backups from private R2 storage.",
        backupWarning: backups.warning,
      });
    }

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
    const id = parseRsvpId(url.searchParams.get("id"));

    if (!id) {
      return Response.json(
        { success: false, error: "Invalid RSVP ID" },
        { status: 400 }
      );
    }

    const existing = await context.env.DB.prepare(
      "SELECT * FROM rsvps WHERE id = ?"
    )
      .bind(id)
      .first<Record<string, unknown>>();

    await context.env.DB.prepare("DELETE FROM rsvps WHERE id = ?")
      .bind(id)
      .run();

    if (existing) {
      context.waitUntil(
        markMatchingBackupsDeleted(
          context.env,
          rowToRsvpInput(existing),
          new Date().toISOString()
        )
      );
    }

    return Response.json({ success: true, message: "RSVP deleted" });
  } catch (err) {
    console.error("RSVP delete error:", err);
    return Response.json(
      { success: false, error: "Failed to delete RSVP" },
      { status: 500 }
    );
  }
};
