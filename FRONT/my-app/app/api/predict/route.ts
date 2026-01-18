export async function POST(request: Request) {
  try {
    const body = await request.json()

    const response = await fetch("https://healigram.onrender.com/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Flask API error: ${response.statusText}`)
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("[v0] Prediction error:", error)
    return Response.json({ error: "Failed to get prediction" }, { status: 500 })
  }
}
