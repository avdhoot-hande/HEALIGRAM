import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000); // 30s

  try {
    const body = await req.json();

    // Resolve backend base (prefer BACKEND env). Fall back to localhost.
    const backendBase =
      process.env.BACKEND ||
      process.env.NEXT_PUBLIC_BACKEND ||
      "http://127.0.0.1:5000";

    // Build final backend URL: if BACKEND already contains '/predict' use it, otherwise append.
    let backendUrl = backendBase;
    if (!/\/predict(\/|$)/.test(backendBase)) {
      backendUrl = backendBase.replace(/\/$/, "") + "/predict";
    }

    console.log(
      "[PREDICT API] Received request:",
      JSON.stringify(body, null, 2),
    );
    console.log("[PREDICT API] Backend URL:", backendUrl);

    const backendRes = await fetch(backendUrl, {
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
    return NextResponse.json({ ...data }, { status: backendRes.status });
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      console.error("[PREDICT API] Backend request timed out");

      return NextResponse.json(
        { error: "Backend request timed out" },
        { status: 504 },
      );
    }

    console.error("[PREDICT API] Error:", err);

    return NextResponse.json(
      {
        error: err.message || "Backend error occurred",
        details:
          process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 },
    );
  }
}
