"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import PredictionForm from "@/components/prediction-form"
import PredictionResult from "@/components/prediction-result"

export default function Predict() {
  const [result, setResult] = useState<{
    prediction: number
    confidence: number
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: Record<string, any>) => {
    setLoading(true)
    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Prediction failed")
      }

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to get prediction. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">Heart Disease Prediction</h1>
          <p className="text-lg text-muted-foreground mb-12">
            Fill in your clinical information below to get an instant prediction.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Form Section */}
            <div>
              <Card className="p-6 border border-border">
                <PredictionForm onSubmit={handleSubmit} loading={loading} />
              </Card>
            </div>

            {/* Result Section */}
            <div>
              {loading ? (
                <Card className="p-8 border border-border flex items-center justify-center min-h-96">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p className="text-muted-foreground">Analyzing your data...</p>
                  </div>
                </Card>
              ) : result ? (
                <PredictionResult result={result} />
              ) : (
                <Card className="p-8 border border-border flex items-center justify-center min-h-96">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📋</div>
                    <p className="text-muted-foreground">
                      Fill out the form and submit to see your prediction results here.
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
