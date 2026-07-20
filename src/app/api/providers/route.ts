import "server-only";

import { NextResponse } from "next/server";
import { providerAvailability } from "@/lib/server/providers";

export async function GET() {
  return NextResponse.json(providerAvailability());
}
