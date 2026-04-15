/**
 * POST /api/admin/hr/attendance/upload
 *
 * Accepts a multipart/form-data file (Excel, PDF, or image).
 * - Excel (.xlsx / .xls / .csv): parsed with `xlsx`
 * - PDF / image: sent to OpenAI GPT-4o with a structured extraction prompt
 *
 * Returns an array of extracted rows for preview before saving:
 * [{ employeeNumber, employeeName, date, clockIn, clockOut, status, hoursWorked, overtimeHours }]
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import * as XLSX from "xlsx";
import OpenAI from "openai";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface ExtractedRow {
  employeeNumber: string | null;
  employeeName:   string | null;
  date:           string;          // YYYY-MM-DD
  clockIn:        string | null;   // HH:MM (24h) or null
  clockOut:       string | null;
  status:         string;          // PRESENT | LATE | ABSENT | HALF_DAY | ON_LEAVE
  hoursWorked:    number | null;
  overtimeHours:  number | null;
}

/* ------------------------------------------------------------------ */
/*  Excel parser                                                         */
/* ------------------------------------------------------------------ */

function parseExcelBuffer(buffer: ArrayBuffer): ExtractedRow[] {
  const wb   = XLSX.read(buffer, { type: "array", cellDates: true });
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: null,
    raw:    false,
    dateNF: "yyyy-mm-dd",
  });

  return rows.map((r) => {
    // Normalise column names (case-insensitive)
    const get = (...keys: string[]): string | null => {
      for (const k of keys) {
        const found = Object.entries(r).find(([col]) =>
          col.toLowerCase().replace(/[\s_-]/g, "").includes(k.toLowerCase().replace(/[\s_-]/g, ""))
        );
        if (found && found[1] != null && String(found[1]).trim()) return String(found[1]).trim();
      }
      return null;
    };

    const rawDate = get("date");
    const dateStr = rawDate ? normaliseDate(rawDate) : new Date().toISOString().split("T")[0];

    const rawStatus  = get("status")?.toUpperCase() ?? "";
    const statusMap: Record<string, string> = {
      PRESENT: "PRESENT", LATE: "LATE", ABSENT: "ABSENT",
      HALFDAY: "HALF_DAY", "HALF DAY": "HALF_DAY",
      ONLEAVE: "ON_LEAVE", "ON LEAVE": "ON_LEAVE", LEAVE: "ON_LEAVE",
    };
    const status = statusMap[rawStatus] ?? inferStatus(get("clockin", "timein", "in"), rawStatus);

    const hours = parseFloat(get("hours", "hoursworked", "totalHours") ?? "") || null;
    const ot    = parseFloat(get("overtime", "ot", "oThours") ?? "") || null;

    return {
      employeeNumber: get("empno", "employeenumber", "empid", "id"),
      employeeName:   get("name", "employeename", "fullname", "employee"),
      date:           dateStr,
      clockIn:        normaliseTime(get("clockin", "timein", "in")),
      clockOut:       normaliseTime(get("clockout", "timeout", "out")),
      status,
      hoursWorked:    hours,
      overtimeHours:  ot,
    };
  }).filter((r) => r.date);
}

/* ------------------------------------------------------------------ */
/*  AI extraction for PDF / image                                        */
/* ------------------------------------------------------------------ */

const EXTRACTION_PROMPT = `You are an attendance data extraction assistant.
Extract ALL attendance records from the provided document and return a JSON array.
Each record must follow this exact structure:
{
  "employeeNumber": "string or null",
  "employeeName": "string or null",
  "date": "YYYY-MM-DD",
  "clockIn": "HH:MM (24-hour) or null",
  "clockOut": "HH:MM (24-hour) or null",
  "status": "PRESENT | LATE | ABSENT | HALF_DAY | ON_LEAVE",
  "hoursWorked": number or null,
  "overtimeHours": number or null
}
Rules:
- Infer status: if clockIn exists and is after 08:30 → LATE; if clockIn exists → PRESENT; if no clockIn → ABSENT
- Convert all times to 24-hour HH:MM format
- Convert all dates to YYYY-MM-DD format
- If no explicit date, use today's date
- Return ONLY the JSON array, no markdown, no explanation.`;

async function extractWithAI(
  fileBytes: Uint8Array,
  mimeType: string
): Promise<ExtractedRow[]> {
  const base64 = Buffer.from(fileBytes).toString("base64");

  // For PDFs, send as base64 text content since GPT-4o can read PDFs via text
  if (mimeType === "application/pdf") {
    const textContent = Buffer.from(fileBytes).toString("latin1");
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `${EXTRACTION_PROMPT}\n\nDocument content (PDF text):\n${textContent.slice(0, 12000)}`,
        },
      ],
      max_tokens: 4096,
      temperature: 0,
    });
    return parseAIResponse(response.choices[0].message.content ?? "");
  }

  // For images: use vision
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: EXTRACTION_PROMPT },
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64}`, detail: "high" },
          },
        ],
      },
    ],
    max_tokens: 4096,
    temperature: 0,
  });
  return parseAIResponse(response.choices[0].message.content ?? "");
}

function parseAIResponse(content: string): ExtractedRow[] {
  // Strip markdown fences if present
  const clean = content
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    const arr = JSON.parse(clean);
    if (!Array.isArray(arr)) return [];
    return arr.map((r) => ({
      employeeNumber: r.employeeNumber ?? null,
      employeeName:   r.employeeName   ?? null,
      date:           r.date           ?? new Date().toISOString().split("T")[0],
      clockIn:        r.clockIn        ?? null,
      clockOut:       r.clockOut       ?? null,
      status:         r.status         ?? "PRESENT",
      hoursWorked:    r.hoursWorked    != null ? Number(r.hoursWorked) : null,
      overtimeHours:  r.overtimeHours  != null ? Number(r.overtimeHours) : null,
    }));
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Utility                                                             */
/* ------------------------------------------------------------------ */

function normaliseDate(raw: string): string {
  // Try various common date formats → YYYY-MM-DD
  const clean = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  const d = new Date(clean);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  return new Date().toISOString().split("T")[0];
}

function normaliseTime(raw: string | null): string | null {
  if (!raw) return null;
  const clean = raw.trim();
  // Already HH:MM
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(clean)) {
    const [h, m] = clean.split(":").map(Number);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  // 12-hour e.g. "8:30 AM"
  const amPm = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (amPm) {
    let h = parseInt(amPm[1]);
    const m = parseInt(amPm[2]);
    if (amPm[3].toUpperCase() === "PM" && h < 12) h += 12;
    if (amPm[3].toUpperCase() === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  return null;
}

function inferStatus(clockIn: string | null, rawStatus: string): string {
  if (rawStatus && rawStatus !== "") return rawStatus;
  if (!clockIn) return "ABSENT";
  const time = normaliseTime(clockIn);
  if (!time) return "ABSENT";
  const [h, m] = time.split(":").map(Number);
  const mins = h * 60 + m;
  return mins > 8 * 60 + 30 ? "LATE" : "PRESENT";
}

/* ------------------------------------------------------------------ */
/*  Route handler                                                        */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const formData = await request.formData();
    const file     = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, data: null, error: "No file provided" }, { status: 400 });
    }

    const name     = file.name.toLowerCase();
    const mime     = file.type;
    const bytes    = new Uint8Array(await file.arrayBuffer());

    let rows: ExtractedRow[] = [];

    if (
      name.endsWith(".xlsx") || name.endsWith(".xls") ||
      name.endsWith(".csv")  ||
      mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("csv")
    ) {
      rows = parseExcelBuffer(bytes.buffer as ArrayBuffer);
    } else if (
      name.endsWith(".pdf") || mime === "application/pdf"
    ) {
      rows = await extractWithAI(bytes, "application/pdf");
    } else if (
      mime.startsWith("image/") ||
      name.endsWith(".png") || name.endsWith(".jpg") ||
      name.endsWith(".jpeg") || name.endsWith(".webp")
    ) {
      const imgMime = mime.startsWith("image/") ? mime : "image/jpeg";
      rows = await extractWithAI(bytes, imgMime);
    } else {
      return NextResponse.json(
        { success: false, data: null, error: "Unsupported file type. Upload Excel (.xlsx/.csv), PDF, or an image." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: rows, error: null });
  } catch (err) {
    console.error("[POST /api/admin/hr/attendance/upload]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Extraction failed" },
      { status: 500 }
    );
  }
}
