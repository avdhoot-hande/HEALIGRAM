"use client"

import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/context/LanguageContext"
import { translations } from "@/lib/translations"

export default function Home() {
  const { language } = useLanguage()
  const t = translations[language]

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
                  {t.heroBadge}
                </span>

                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  {t.heroTitle1}{" "}
                  <span className="text-primary">{t.heroTitleHighlight}</span>{" "}
                  {t.heroTitle2}
                </h1>

                <p className="text-lg text-muted-foreground max-w-xl">
                  {t.heroDesc}
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                  <Link href="/predict">
                    <Button size="lg" className="hover:scale-[1.04] transition-all shadow-lg shadow-primary/30">
                      {t.checkRisk}
                    </Button>
                  </Link>

                  <Link href="/about">
                    <Button size="lg" variant="outline" className="hover:border-primary hover:text-primary transition">
                      {t.howItWorks}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* RIGHT CARD */}
              <div className="relative flex justify-center animate-fade-up delay-200">
                <div className="w-full max-w-md rounded-2xl border border-border bg-background/80 backdrop-blur p-8 shadow-2xl animate-float">

                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-lg">{t.aiSummary}</h3>
                    <span className="text-xs text-muted-foreground">
                      {t.sampleOutput}
                    </span>
                  </div>

                  {/* Risk Level */}
                  <div className="mb-6">
                    <p className="text-sm text-muted-foreground mb-1">
                      {t.predictedRisk}
                    </p>
                    <p className="text-xl font-bold text-primary">
                      {t.moderateRisk}
                    </p>
                  </div>

                  {/* Factors */}
                  <div className="space-y-4">
                    {[
                      { label: t.bloodPressure, value: 70 },
                      { label: t.cholesterol, value: 60 },
                      { label: t.ageFactor, value: 50 },
                    ].map((item, i) => (
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
                      {t.modelConfidence}
                    </p>
                    <p className="font-semibold">{t.confidenceValue}</p>
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
              {t.infoTitle}
            </h2>

            <div className="grid md:grid-cols-3 gap-10">
              {[
                { icon: "🧠", title: t.mlTitle, desc: t.mlDesc },
                { icon: "🏥", title: t.careTitle, desc: t.careDesc },
                { icon: "🌍", title: t.ruralTitle, desc: t.ruralDesc },
              ].map((f, i) => (
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
              {t.ctaTitle}
            </h2>
            <p className="text-lg mb-8 opacity-90">
              {t.ctaDesc}
            </p>
            <Link href="/predict">
              <Button size="lg" variant="secondary">
                {t.startPrediction}
              </Button>
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
