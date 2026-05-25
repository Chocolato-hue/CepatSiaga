import { NextRequest, NextResponse } from "next/server";

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken() {
  const now = Date.now();

  // Reuse token if still valid
  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }

  const clientId = process.env.SATUSEHAT_CLIENT_ID;
  const clientSecret = process.env.SATUSEHAT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  const authUrl =
    "https://api-satusehat-dev.dto.kemkes.go.id/oauth2/v1/accesstoken?grant_type=client_credentials";

  const authBody = new URLSearchParams();
  authBody.set("client_id", clientId);
  authBody.set("client_secret", clientSecret);

  const authRes = await fetch(authUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: authBody,
  });

  if (!authRes.ok) {
    return null;
  }

  const authData = await authRes.json();

  cachedToken = authData.access_token;

  // Expire slightly earlier for safety
  tokenExpiry = Date.now() + ((authData.expires_in || 3600) - 60) * 1000;

  return cachedToken;
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/rumah sakit/gi, "rs")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const name = searchParams.get("name") || "";
    const type = searchParams.get("type") || "";

    if (!name) {
      return NextResponse.json(
        { verified: false },
        { status: 400 }
      );
    }

    const token = await getAccessToken();

    // fallback if no SATUSEHAT key
    if (!token) {
      const n = normalize(name);

      const likelyGov =
        n.includes("rsud") ||
        n.includes("rsup") ||
        n.includes("puskesmas");

      return NextResponse.json({
        verified: likelyGov,
      });
    }

    const searchUrl =
      `https://api-satusehat-dev.dto.kemkes.go.id/fhir-r4/v1/Organization?name=${encodeURIComponent(name)}`;

    const searchRes = await fetch(searchUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!searchRes.ok) {
      return NextResponse.json({
        verified: false,
      });
    }

    const data = await searchRes.json();

    const entries = data.entry || [];

    const normalizedInput = normalize(name);

    const matched = entries.find((entry: any) => {
      const resource = entry.resource;

      if (!resource) return false;

      const orgName = normalize(resource.name || "");

      const typeText = normalize(
        resource.type?.[0]?.text || ""
      );

      const nameMatch =
        orgName.includes(normalizedInput) ||
        normalizedInput.includes(orgName);

      let validType = true;

      if (type === "hospital") {
        validType =
          typeText.includes("hospital") ||
          orgName.includes("rs");
      }

      if (type === "clinic") {
        validType =
          typeText.includes("clinic") ||
          orgName.includes("klinik") ||
          orgName.includes("puskesmas");
      }

      return nameMatch && validType;
    });

    return NextResponse.json({
      verified: !!matched,
    });
  } catch (error) {
    console.error("SATUSEHAT verify error:", error);

    return NextResponse.json({
      verified: false,
    });
  }
}