"use client"

import { Card } from "@/components/ui/card"

interface PredictionResultProps {
  result: {
    prediction: number
    confidence: number
    risk_factors?: string[]
    critical_factors?: string[]
    moderate_factors?: string[]
    lifestyle_factors?: string[]
  }
}


export default function PredictionResult({ result }: PredictionResultProps) {
  const hasDisease = result.prediction === 1
  const confidence = result.confidence

  // Determine risk level based on confidence
  const getRiskLevel = (conf: number) => {
    if (conf >= 70) return { level: "HIGH RISK", color: "text-red-700", bgColor: "bg-red-100", borderColor: "border-red-400" };
    if (conf >= 40) return { level: "MEDIUM RISK", color: "text-orange-700", bgColor: "bg-orange-100", borderColor: "border-orange-400" };
    return { level: "LOW RISK", color: "text-green-700", bgColor: "bg-green-100", borderColor: "border-green-400" };
  };

  // Determine model confidence level
  const getModelConfidence = (conf: number) => {
    if (conf >= 75) return { 
      level: "HIGH CONFIDENCE", 
      message: "Model is highly certain about this prediction",
      color: "text-blue-700", 
      bgColor: "bg-blue-100", 
      borderColor: "border-blue-400",
      emoji: "🎯"
    };
    if (conf >= 50) return { 
      level: "MEDIUM CONFIDENCE", 
      message: "Model has moderate certainty about this prediction",
      color: "text-purple-700", 
      bgColor: "bg-purple-100", 
      borderColor: "border-purple-400",
      emoji: "📊"
    };
    return { 
      level: "LOW CONFIDENCE", 
      message: "Model has lower certainty about this prediction",
      color: "text-slate-700", 
      bgColor: "bg-slate-100", 
      borderColor: "border-slate-400",
      emoji: "⚠️"
    };
  };

  const riskLevel = getRiskLevel(confidence);
  const modelConfidence = getModelConfidence(confidence);

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
          
          <p className="text-lg font-semibold text-primary mb-2">Probability : {confidence}%</p>
          <p className="text-sm text-muted-foreground mb-4"> {modelConfidence.level}</p>
          
          <div className="w-full bg-border rounded-full h-2 mb-4">
            <div
              className={`h-2 rounded-full transition-all ${hasDisease ? "bg-destructive" : "bg-accent"}`}
              style={{ width: `${confidence}%` }}
            ></div>
          </div>
        </div>
      </Card>

      {/* All Risk Factors Card - Single Yellow Display */}
      {result.risk_factors && result.risk_factors.length > 0 && (
        <Card className="p-6 border-2 border-yellow-500 bg-yellow-50">
          <h3 className="text-lg font-bold mb-4 text-yellow-800 flex items-center gap-2">⚡ Identified Risk Factors</h3>
          <ul className="space-y-3">
            {result.risk_factors.map((factor, index) => {
              // Determine if this is a critical factor
              const isCritical = result.critical_factors?.includes(factor);
              const isModerate = result.moderate_factors?.includes(factor);
              
              return (
                <li key={index} className="flex gap-3">
                  <span className={`font-bold text-lg ${
                    isCritical ? "text-red-600" : isModerate ? "text-orange-600" : "text-yellow-600"
                  }`}>
                    {isCritical ? "🔴" : isModerate ? "🟠" : "🟡"}
                  </span>
                  <span className="text-foreground">{factor}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

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
