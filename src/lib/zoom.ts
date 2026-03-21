/**
 * Zoom Server-to-Server OAuth — creates meetings on behalf of the account.
 * Requires: ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET in .env
 */

interface ZoomTokenResponse {
  access_token: string;
  expires_in: number;
}

interface ZoomMeeting {
  id: string;
  join_url: string;
  start_url: string;
  password: string;
}

let _cachedToken: string | null = null;
let _tokenExpiry = 0;

async function getZoomToken(): Promise<string> {
  const now = Date.now();
  if (_cachedToken && now < _tokenExpiry) return _cachedToken;

  const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = process.env;
  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
    throw new Error("Zoom credentials are not configured.");
  }

  const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${credentials}` },
    }
  );

  if (!res.ok) throw new Error(`Zoom token error: ${res.status}`);
  const data = (await res.json()) as ZoomTokenResponse;
  _cachedToken = data.access_token;
  _tokenExpiry = now + (data.expires_in - 60) * 1000;
  return _cachedToken;
}

export async function createZoomMeeting(params: {
  topic: string;
  startTime: string; // ISO string
  durationMinutes?: number;
}): Promise<ZoomMeeting> {
  const token = await getZoomToken();
  const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: params.topic,
      type: 2, // scheduled
      start_time: params.startTime,
      duration: params.durationMinutes ?? 60,
      settings: {
        join_before_host: false,
        waiting_room: true,
        auto_recording: "none",
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Zoom meeting creation failed: ${err}`);
  }
  return (await res.json()) as ZoomMeeting;
}

export const isZoomAvailable = (): boolean =>
  Boolean(
    process.env.ZOOM_ACCOUNT_ID &&
      process.env.ZOOM_CLIENT_ID &&
      process.env.ZOOM_CLIENT_SECRET
  );
