import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    const backendBase =
      process.env.BACKEND ||
      process.env.NEXT_PUBLIC_BACKEND ||
      "http://127.0.0.1:5000";

    let backendUrl = backendBase;
    if (!/\/predict(\/|$)/.test(backendBase)) {
      backendUrl = backendBase.replace(/\/$/, "") + "/predict";
    }

    console.log("[PREDICT API] Backend URL:", backendUrl);

    const contentType = req.headers.get("content-type") || "";

    let backendRes: Response;

    if (contentType.includes("multipart/form-data")) {
      // ── FormData (biometrics + optional ECG file) ──
      // Forward the raw formData directly — do NOT re-set Content-Type,
      // the browser-generated boundary in the header must be preserved.
      const formData = await req.formData();

      console.log("[PREDICT API] Forwarding multipart/form-data");

      backendRes = await fetch(backendUrl, {
        method: "POST",
        body: formData,       // fetch sets the correct Content-Type + boundary automatically
        signal: controller.signal,
      });
    } else {
      // ── JSON (biometrics only, no file) ──
      const body = await req.json();

      console.log("[PREDICT API] Forwarding JSON:", JSON.stringify(body));

      backendRes = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);

    console.log("[PREDICT API] Backend status:", backendRes.status);

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });

  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      console.error("[PREDICT API] Timed out");
      return NextResponse.json({ error: "Backend request timed out" }, { status: 504 });
    }

    console.error("[PREDICT API] Error:", err);
    return NextResponse.json(
      { error: err.message || "Backend error occurred" },
      { status: 500 }
    );
  }
}