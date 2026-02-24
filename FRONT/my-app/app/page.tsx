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

      {/* ================= LEFT CONTENT ================= */}
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
            <Button
              size="lg"
              className="hover:scale-[1.04] transition-all shadow-lg shadow-primary/30"
            >
              {t.checkRisk}
            </Button>
          </Link>

          <Link href="/about">
            <Button
              size="lg"
              variant="outline"
              className="hover:border-primary hover:text-primary transition"
            >
              {t.howItWorks}
            </Button>
          </Link>
        </div>
      </div>

      {/* ================= RIGHT — AI HEALTHCARE CARD ================= */}
      <div className="relative flex justify-center animate-fade-up delay-200">
        <div className="w-full max-w-md rounded-3xl border border-border bg-background/90 backdrop-blur-xl p-8 shadow-2xl animate-float">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-lg tracking-tight">
                {t.aiSummary}
              </h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                Clinical Analysis
              </p>
            </div>

            <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase">
                Live Processing
              </span>
            </div>
          </div>

          {/* Animated Sync Area */}
          <div className="relative h-44 mb-8 rounded-2xl bg-muted/30 border border-border flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:20px_20px]" />

            <svg viewBox="0 0 200 100" className="w-full h-full relative z-10 p-4">
              <circle
                cx="150"
                cy="50"
                r="15"
                className="fill-primary/5 stroke-primary stroke-1 animate-core-pulse"
              />
              <path
                d="M146,50 L149,50 L151,44 L153,56 L155,50 L158,50"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-primary animate-heart-beat-path"
              />

              {[25, 50, 75].map((y, i) => (
                <g key={i}>
                  <circle r="2.5" className="fill-primary animate-data-travel">
                    <animateMotion
                      path={`M30,${y} C70,${y} 100,50 135,50`}
                      dur={`${2 + i * 0.5}s`}
                      repeatCount="indefinite"
                    />
                  </circle>

                  <path
                    d={`M30,${y} C70,${y} 100,50 135,50`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-muted"
                  />

                  <circle cx="30" cy={y} r="3" className="fill-muted-foreground" />
                </g>
              ))}
            </svg>

            <div className="absolute right-[17%] w-20 h-20 rounded-full border border-primary/10 animate-ripple" />
          </div>

          {/* Risk Level */}
          <div className="text-center mb-8">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
              {t.predictedRisk}
            </p>

            <div className="inline-block px-4 py-1 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-xl font-black text-primary tracking-tight">
                {t.moderateRisk}
              </span>
            </div>
          </div>

          {/* Factors */}
          <div className="space-y-4">
            {[
              { label: t.bloodPressure, value: 70 },
              { label: t.cholesterol, value: 60 },
              { label: t.ageFactor, value: 50 },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground mb-1.5">
                  <span>{item.label}</span>
                  <span className="text-foreground">{item.value}%</span>
                </div>

                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-1000"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-5 border-t border-border flex items-center justify-between">
            <div>
              <p className="text-[9px] text-muted-foreground uppercase font-black">
                {t.modelConfidence}
              </p>
              <p className="text-sm font-bold">
                {t.confidenceValue}
              </p>
            </div>

            <div className="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black border border-blue-100 uppercase">
              Secure Data
            </div>
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
