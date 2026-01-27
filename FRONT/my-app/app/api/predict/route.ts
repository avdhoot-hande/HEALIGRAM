import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000); // 30s

  try {
    const body = await req.json();

    console.log("[PREDICT API] Received request:", JSON.stringify(body, null, 2));
    console.log("[PREDICT API] Backend URL:", process.env.BACKEND);

    if (!process.env.BACKEND) {
      return NextResponse.json(
        { error: "Backend URL not configured. Set BACKEND environment variable." },
        { status: 500 }
      );
    }

    const backendRes = await fetch(process.env.BACKEND, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal, // ✅ timeout handled here
    });

    clearTimeout(timeoutId);

    console.log("[PREDICT API] Backend response status:", backendRes.status);

    const data = await backendRes.json();
    console.log("[PREDICT API] Backend response:", data);

    // Backend already includes categorized risk factors, just pass through
    return NextResponse.json(
      { ...data },
      { status: backendRes.status }
    );

  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      console.error("[PREDICT API] Backend request timed out");

      return NextResponse.json(
        { error: "Backend request timed out" },
        { status: 504 }
      );
    }

    console.error("[PREDICT API] Error:", err);

    return NextResponse.json(
      {
        error: err.message || "Backend error occurred",
        details: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
  
}
