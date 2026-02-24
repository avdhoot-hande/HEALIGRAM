import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const backendBase =
    process.env.BACKEND ||
    process.env.NEXT_PUBLIC_BACKEND ||
    "http://127.0.0.1:5000";

  // Normalize and construct backend URL
  let backendUrl = backendBase.replace(/\/$/, "");

  if (/\/predict\/pdf(\/|$)/.test(backendBase)) {
    backendUrl = backendBase.replace(/\/$/, "");
  } else if (/\/predict(\/|$)/.test(backendBase)) {
    backendUrl = backendBase.replace(/\/$/, "") + "/pdf";
  } else {
    backendUrl = backendBase.replace(/\/$/, "") + "/predict/pdf";
  }

  console.log("[PREDICT PDF API] Forwarding to:", backendUrl);

  const backendRes = await fetch(backendUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const contentType = backendRes.headers.get("content-type") || "";

  // 🚨 IMPORTANT SAFETY CHECK
  if (!backendRes.ok || !contentType.includes("application/pdf")) {
    const text = await backendRes.text().catch(() => "");

    console.error("[PREDICT PDF API] Invalid PDF response:", {
      status: backendRes.status,
      contentType,
      body: text,
    });

    return NextResponse.json(
      {
        error: "Backend did not return a valid PDF",
        details: text,
      },
      { status: 500 }
    );
  }

  const pdfBuffer = await backendRes.arrayBuffer();

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=health-report.pdf",
      "Content-Length": pdfBuffer.byteLength.toString(),
    },
  });
}
