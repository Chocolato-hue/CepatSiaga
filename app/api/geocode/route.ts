import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  const lang = searchParams.get("lang") || "id";
  const acceptLanguage = lang === "en" ? "en-US,en;q=0.9" : "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7";

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=${lang}`, {
      headers: {
        "User-Agent": "CepatSiaga-Emergency-App/1.0",
        "Accept-Language": acceptLanguage
      }
    });
    
    if (!res.ok) {
        throw new Error("Failed to fetch from Nominatim");
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Geocode error:", error);
    return NextResponse.json({ error: "Failed to geocode" }, { status: 500 });
  }
}
