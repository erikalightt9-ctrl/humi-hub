/**
 * Google Calendar Service
 *
 * Wraps googleapis calendar v3. Handles:
 *  - OAuth2 client construction with auto-refresh
 *  - Create / Update / Delete / List events
 *  - ISO datetime + timezone conversion
 */

import { google, calendar_v3 } from "googleapis";
import type { GoogleCalendarToken } from "@prisma/client";
import { upsertToken } from "@/lib/repositories/google-token.repository";

// ── Constants ─────────────────────────────────────────────────────────────────

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a date-time string from "YYYY-MM-DD" + "HH:MM" in the given timezone */
function buildDateTime(date: string, time: string, tz: string): string {
  // "2026-03-22" + "09:00" → "2026-03-22T09:00:00"
  return new Date(`${date}T${time}:00`).toLocaleString("sv-SE", {
    timeZone: tz,
    hour12: false,
  }).replace(" ", "T");
}

/** Convert a local CalendarEvent to a Google Calendar event body */
function toGoogleEvent(params: {
  title: string;
  description?: string | null;
  date: string;         // "YYYY-MM-DD"
  startTime?: string | null;  // "HH:MM"
  endTime?: string | null;    // "HH:MM"
  timezone: string;
}): calendar_v3.Schema$Event {
  const { title, description, date, startTime, endTime, timezone } = params;

  if (startTime && endTime) {
    return {
      summary: title,
      description: description ?? undefined,
      start: {
        dateTime: buildDateTime(date, startTime, timezone),
        timeZone: timezone,
      },
      end: {
        dateTime: buildDateTime(date, endTime, timezone),
        timeZone: timezone,
      },
    };
  }

  // All-day event
  return {
    summary: title,
    description: description ?? undefined,
    start: { date },
    end:   { date },
  };
}

// ── OAuth2 client factory ─────────────────────────────────────────────────────

export function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!,
  );
}

export function getAuthUrl(): string {
  const oauth2 = createOAuthClient();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",   // force to always return refresh_token
    scope: SCOPES,
  });
}

/**
 * Build a ready-to-use OAuth2 client from stored tokens.
 * Auto-refreshes the access token if expired and persists the new token.
 */
async function buildAuthClient(
  token: GoogleCalendarToken,
): Promise<InstanceType<typeof google.auth.OAuth2>> {
  const oauth2 = createOAuthClient();

  oauth2.setCredentials({
    access_token: token.accessToken,
    refresh_token: token.refreshToken ?? undefined,
    token_type: token.tokenType ?? "Bearer",
    expiry_date: token.expiresAt ? token.expiresAt.getTime() : undefined,
  });

  // Auto-save refreshed tokens
  oauth2.on("tokens", async (newTokens) => {
    await upsertToken(token.userId, token.userRole, {
      accessToken: newTokens.access_token ?? token.accessToken,
      refreshToken: newTokens.refresh_token ?? token.refreshToken,
      tokenType: newTokens.token_type ?? token.tokenType,
      expiresAt: newTokens.expiry_date
        ? new Date(newTokens.expiry_date)
        : token.expiresAt,
    });
  });

  return oauth2;
}

// ── Calendar operations ───────────────────────────────────────────────────────

/** Create a Google Calendar event. Returns the created event's id. */
export async function createGoogleEvent(
  token: GoogleCalendarToken,
  params: {
    title: string;
    description?: string | null;
    date: string;
    startTime?: string | null;
    endTime?: string | null;
    timezone?: string;
  },
): Promise<string | null> {
  try {
    const auth = await buildAuthClient(token);
    const cal = google.calendar({ version: "v3", auth });

    const res = await cal.events.insert({
      calendarId: token.calendarId,
      requestBody: toGoogleEvent({ ...params, timezone: params.timezone ?? "UTC" }),
    });

    return res.data.id ?? null;
  } catch (err) {
    console.error("[GoogleCalendar] createGoogleEvent failed:", err);
    return null;
  }
}

/** Update an existing Google Calendar event. */
export async function updateGoogleEvent(
  token: GoogleCalendarToken,
  googleEventId: string,
  params: {
    title: string;
    description?: string | null;
    date: string;
    startTime?: string | null;
    endTime?: string | null;
    timezone?: string;
  },
): Promise<void> {
  try {
    const auth = await buildAuthClient(token);
    const cal = google.calendar({ version: "v3", auth });

    await cal.events.update({
      calendarId: token.calendarId,
      eventId: googleEventId,
      requestBody: toGoogleEvent({ ...params, timezone: params.timezone ?? "UTC" }),
    });
  } catch (err) {
    console.error("[GoogleCalendar] updateGoogleEvent failed:", err);
  }
}

/** Delete a Google Calendar event. Silently ignores 404. */
export async function deleteGoogleEvent(
  token: GoogleCalendarToken,
  googleEventId: string,
): Promise<void> {
  try {
    const auth = await buildAuthClient(token);
    const cal = google.calendar({ version: "v3", auth });

    await cal.events.delete({
      calendarId: token.calendarId,
      eventId: googleEventId,
    });
  } catch (err: unknown) {
    // 410 = already deleted, 404 = not found — both are safe to ignore
    const status = (err as { code?: number })?.code;
    if (status !== 404 && status !== 410) {
      console.error("[GoogleCalendar] deleteGoogleEvent failed:", err);
    }
  }
}

/** List Google Calendar events in a time range. */
export async function listGoogleEvents(
  token: GoogleCalendarToken,
  timeMin: string,
  timeMax: string,
): Promise<calendar_v3.Schema$Event[]> {
  try {
    const auth = await buildAuthClient(token);
    const cal = google.calendar({ version: "v3", auth });

    const res = await cal.events.list({
      calendarId: token.calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
    });

    return res.data.items ?? [];
  } catch (err) {
    console.error("[GoogleCalendar] listGoogleEvents failed:", err);
    return [];
  }
}

/** Exchange an auth code for tokens. Returns the token data. */
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresAt?: Date;
}> {
  const oauth2 = createOAuthClient();
  const { tokens } = await oauth2.getToken(code);

  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token ?? undefined,
    tokenType: tokens.token_type ?? undefined,
    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
  };
}

export { SCOPES };
