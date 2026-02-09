"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useLanguage } from "@/context/LanguageContext"
import { translations } from "@/lib/translations"

export default function About() {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-foreground">
            {t.aboutTitle}
          </h1>

          {/* Mission */}
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-primary">
              {t.missionTitle}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t.missionDesc}
            </p>
          </section>

          {/* How it works */}
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-primary">
              {t.howItWorksTitle}
            </h2>

            <div className="space-y-6">
              {[
                { title: t.step1Title, desc: t.step1Desc },
                { title: t.step2Title, desc: t.step2Desc },
                { title: t.step3Title, desc: t.step3Desc },
              ].map((s, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    {s.title}
                  </h3>
                  <p className="text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* What we analyze */}
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-primary">
              {t.analyzeTitle}
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-secondary rounded-lg p-6">
                <h3 className="font-semibold mb-3 text-foreground">
                  {t.clinicalTitle}
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  {t.clinicalList.map((item: string, i: number) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-secondary rounded-lg p-6">
                <h3 className="font-semibold mb-3 text-foreground">
                  {t.lifestyleTitle}
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  {t.lifestyleList.map((item: string, i: number) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="bg-accent/10 border border-accent/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              {t.disclaimerTitle}
            </h3>
            <p className="text-muted-foreground">
              {t.disclaimerDesc}
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
