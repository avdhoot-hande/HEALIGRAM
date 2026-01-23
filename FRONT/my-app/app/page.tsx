"use client"

import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">

        {/* ================= HERO SECTION ================= */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 py-24 md:py-32">
          <div className="absolute -top-32 left-1/2 -z-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* LEFT CONTENT */}
              <div className="space-y-6 animate-fade-up">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-sm text-primary">
                  ❤️ AI-assisted heart risk prediction
                </span>

                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  Understand Your{" "}
                  <span className="text-primary">Heart Disease Risk</span>{" "}
                  Before Symptoms Appear
                </h1>

                <p className="text-lg text-muted-foreground max-w-xl">
                  Healigram analyzes essential clinical and lifestyle parameters
                  using machine learning to estimate the likelihood of heart
                  disease — enabling early awareness and preventive action.
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                  <Link href="/predict">
                    <Button
                      size="lg"
                      className="hover:scale-[1.04] transition-all shadow-lg shadow-primary/30"
                    >
                      Check Risk Now
                    </Button>
                  </Link>

                  <Link href="/about">
                    <Button
                      size="lg"
                      variant="outline"
                      className="hover:border-primary hover:text-primary transition"
                    >
                      How It Works
                    </Button>
                  </Link>
                </div>
              </div>

              {/* RIGHT — AI NEURAL PULSE CARD */}
              <div className="relative flex justify-center animate-fade-up delay-200">
                <div className="w-full max-w-md rounded-2xl border border-border bg-background/80 backdrop-blur p-8 shadow-2xl animate-float">

                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-lg">AI Risk Summary</h3>
                    <span className="text-xs text-muted-foreground">
                      Sample Output
                    </span>
                  </div>

                  {/* Neural Pulse Animation */}
                  <div className="relative h-32 mb-6 overflow-hidden">
                    <svg viewBox="0 0 600 120" className="h-full w-full">
                      {/* Pulsing waves */}
                      {[...Array(3)].map((_, i) => (
                        <path
                          key={i}
                          d="M0 60 Q100 20 200 60 T400 60 T600 60"
                          stroke={`hsl(${120 - i * 40}, 80%, 50%)`}
                          strokeWidth={3 - i}
                          fill="none"
                          className={`animate-pulse-wave delay-${i * 100}`}
                        />
                      ))}

                      {/* Floating AI dots */}
                      {[...Array(6)].map((_, i) => (
                        <circle
                          key={i}
                          cx={i * 100 + 50}
                          cy={60}
                          r={4}
                          className={`animate-dot-pulse delay-${i * 150}`}
                          fill="currentColor"
                        />
                      ))}
                    </svg>
                  </div>

                  {/* Risk Level */}
                  <div className="mb-6">
                    <p className="text-sm text-muted-foreground mb-1">
                      Predicted Risk Level
                    </p>
                    <p className="text-xl font-bold text-primary">
                      Moderate Risk
                    </p>
                  </div>

                  {/* Factors */}
                  <div className="space-y-4">
                    {[{ label: "Blood Pressure", value: 70 },
                      { label: "Cholesterol", value: 60 },
                      { label: "Age Factor", value: 50 }].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{item.label}</span>
                          <span>{item.value}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-1000"
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Confidence */}
                  <div className="mt-6 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Model Confidence
                    </p>
                    <p className="font-semibold">High (Validated Dataset)</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ================= INFO SECTION ================= */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-14">
              Designed for Early Detection & Accessibility
            </h2>

            <div className="grid md:grid-cols-3 gap-10">
              {[{
                  icon: "🧠",
                  title: "Machine Learning Models",
                  desc: "Logistic Regression, Random Forest, and XGBoost analyze complex medical patterns.",
                },
                {
                  icon: "🏥",
                  title: "Primary Care Support",
                  desc: "Helps healthcare workers identify high-risk patients before complications arise.",
                },
                {
                  icon: "🌍",
                  title: "Rural-Friendly Approach",
                  desc: "Requires only basic clinical inputs, making it suitable for low-resource settings.",
                }].map((f, i) => (
                <div
                  key={i}
                  className="group rounded-xl border border-border bg-card p-8 transition-all hover:-translate-y-2 hover:shadow-xl"
                >
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= CTA ================= */}
        <section className="bg-primary text-primary-foreground py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Take a Step Towards Preventive Heart Care
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Early risk awareness can guide lifestyle changes and timely
              medical consultation.
            </p>
            <Link href="/predict">
              <Button size="lg" variant="secondary">
                Start Prediction
              </Button>
            </Link>
          </div>
        </section>

        {/* ================= ANIMATIONS ================= */}
        <style jsx>{`
          @keyframes float {
            0% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0); }
          }
          .animate-float {
            animation: float 4s ease-in-out infinite;
          }

          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-up {
            animation: fadeUp 0.8s ease-out forwards;
          }

          /* Neural Pulse Animations */
          @keyframes pulseWave {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(50%); }
            100% { transform: translateX(100%); }
          }
          .animate-pulse-wave {
            animation: pulseWave 3s linear infinite;
          }

          @keyframes dotPulse {
            0%,100% { transform: translateY(0); opacity: 0.6; }
            50% { transform: translateY(-12px); opacity: 1; }
          }
          .animate-dot-pulse {
            animation: dotPulse 2s ease-in-out infinite;
          }

          ${[0,1,2,3,4,5].map(i => `
            .delay-${i*100} { animation-delay: ${i*0.2}s; }
          `).join('')}
        `}</style>
      </main>

      <Footer />
    </div>
  )
}
