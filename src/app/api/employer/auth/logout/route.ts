import { NextResponse } from "next/server";
import { EMPLOYER_COOKIE } from "@/lib/employer-auth";

export async function POST() {
  const response = NextResponse.json({ success: true, data: null, error: null });
  response.cookies.delete(EMPLOYER_COOKIE);
  return response;
}
