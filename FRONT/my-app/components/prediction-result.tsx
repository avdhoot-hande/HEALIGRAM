"use client"

import { Card } from "@/components/ui/card"

interface PredictionResultProps {
  result: {
    prediction: number
    confidence: number
  }
}

export default function PredictionResult({ result }: PredictionResultProps) {
  const hasDisease = result.prediction === 1
  const confidence = result.confidence

  return (
    <div className="space-y-4">
      {/* Main Result Card */}
      <Card
        className={`p-6 border-2 ${hasDisease ? "border-destructive bg-destructive/5" : "border-accent bg-accent/5"}`}
      >
        <div className="text-center">
          <div className="text-4xl mb-4">{hasDisease ? "⚠️" : "✅"}</div>
          <h2 className="text-2xl font-bold mb-2 text-foreground">
            {hasDisease ? "Heart Disease Risk Detected" : "No Heart Disease Detected"}
          </h2>
          <p className="text-lg font-semibold text-primary mb-4">Confidence: {confidence}%</p>
          <div className="w-full bg-border rounded-full h-2 mb-4">
            <div
              className={`h-2 rounded-full transition-all ${hasDisease ? "bg-destructive" : "bg-accent"}`}
              style={{ width: `${confidence}%` }}
            ></div>
          </div>
        </div>
      </Card>

      {/* Recommendations Card */}
      <Card className="p-6 border border-border">
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          {hasDisease ? "Recommended Actions" : "Health Tips"}
        </h3>
        <ul className="space-y-3">
          {hasDisease ? (
            <>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span className="text-muted-foreground">Consult a cardiologist or healthcare provider immediately</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span className="text-muted-foreground">Reduce sodium intake to manage blood pressure</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span className="text-muted-foreground">Maintain regular exercise (30 minutes daily)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span className="text-muted-foreground">Quit smoking if applicable</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span className="text-muted-foreground">Limit alcohol consumption</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span className="text-muted-foreground">Monitor cholesterol and glucose levels regularly</span>
              </li>
            </>
          ) : (
            <>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span className="text-muted-foreground">Continue your healthy lifestyle habits</span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span className="text-muted-foreground">Stay physically active with regular exercise</span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span className="text-muted-foreground">Maintain a balanced, heart-healthy diet</span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span className="text-muted-foreground">Keep blood pressure and cholesterol in check</span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span className="text-muted-foreground">Get regular health check-ups</span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span className="text-muted-foreground">Manage stress through meditation or relaxation</span>
              </li>
            </>
          )}
        </ul>
      </Card>

      {/* Disclaimer */}
      <Card className="p-4 border border-border bg-secondary/50">
        <p className="text-sm text-muted-foreground">
          <strong>Disclaimer:</strong> This prediction is for informational purposes only and is not a substitute for
          professional medical advice. Always consult with a qualified healthcare provider for medical concerns.
        </p>
      </Card>
    </div>
  )
}
