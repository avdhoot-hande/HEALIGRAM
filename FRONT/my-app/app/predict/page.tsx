"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import PredictionForm from "@/components/prediction-form"
import PredictionResult from "@/components/prediction-result"
import { useLanguage } from "@/context/LanguageContext"
import { translations } from "@/lib/translations"
import NearbyHospitals from "@/components/nearby-hospitals"


export default function Predict() {
  const { language } = useLanguage()
  const t = translations[language]

  const [result, setResult] = useState<{
    prediction: number
    confidence: number
    risk_factors?: string[]
    critical_factors?: string[]
    moderate_factors?: string[]
    lifestyle_factors?: string[]
  } | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedData, setSubmittedData] = useState<Record<string, any> | null>(null)
  const [backendStatus, setBackendStatus] =
    useState<"checking" | "connected" | "error">("checking")

  // Check backend connection on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            age: 16425,
            gender: 1,
            height: 170,
            weight: 70,
            ap_hi: 120,
            ap_lo: 80,
            cholesterol: 1,
            gluc: 1,
            smoke: 0,
            alco: 0,
            active: 1,
          }),
        })

        if (response.ok) {
          setBackendStatus("connected")
        } else {
          setBackendStatus("error")
        }
      } catch (err) {
        setBackendStatus("error")
        console.error("Backend check failed:", err)
      }
    }

    checkBackend()
  }, [])

  const downloadPDF = async () => {
  if (!submittedData) return

  const response = await fetch("/api/predict/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submittedData),
  })

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = "health-report.pdf"
  document.body.appendChild(link)
  link.click()

  link.remove()
  window.URL.revokeObjectURL(url)
}


  const handleSubmit = async (formData: Record<string, any>) => {
    setLoading(true)
    setError(null)
    setSubmittedData(formData)


    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.error || "Prediction failed"
        throw new Error(errorMsg)
      }

      const data = await response.json()
      setResult(data)
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error occurred"
      setError(errorMsg)
      alert(`Failed to get prediction: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            {t.predictTitle}
          </h1>

          <p className="text-lg text-muted-foreground mb-12">
            {t.predictSubtitle}
          </p>

          {/* Backend Status Indicator */}
          <div className="mb-6 flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                backendStatus === "connected"
                  ? "bg-green-500"
                  : backendStatus === "error"
                  ? "bg-red-500"
                  : "bg-yellow-500"
              }`}
            ></div>

            <span className="text-sm text-muted-foreground">
              {backendStatus === "connected"
                ? t.backendConnected
                : backendStatus === "error"
                ? t.backendError
                : t.backendChecking}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Form Section */}
            <div>
              <Card className="p-6 border border-border">
                <PredictionForm onSubmit={handleSubmit} loading={loading} />
              </Card>
               <NearbyHospitals />
              
            </div>

            {/* Result Section */}
            <div>
              {loading ? (
                <Card className="p-8 border border-border flex items-center justify-center min-h-96">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p className="text-muted-foreground">
                      {t.loadingAnalysis}
                    </p>
                  </div>
                </Card>
              ) : error ? (
                <Card className="p-8 border border-border border-red-500 bg-red-50">
                  <div className="text-center">
                    <div className="text-4xl mb-4">❌</div>
                    <p className="text-red-700 font-semibold">
                      {t.errorTitle}
                    </p>
                    <p className="text-red-600 mt-2">{error}</p>
                    <p className="text-red-500 text-xs mt-4">
                      {t.errorHint}
                    </p>
                  </div>
                </Card>
              ) : result ? (
                <>
    <PredictionResult result={result} />

    <button
      onClick={downloadPDF}
      className="mt-4 w-full bg-primary text-white py-2 rounded"
    >
      📄 Download PDF Report
    </button>
  </>
              ) : (
                <Card className="p-8 border border-border flex items-center justify-center min-h-96">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📋</div>
                    <p className="text-muted-foreground">
                      {t.emptyResultHint}
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
