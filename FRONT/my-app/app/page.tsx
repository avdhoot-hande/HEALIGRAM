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
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/5 to-accent/5 py-20 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
                Predict Heart Disease Risk Instantly
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
                Healigram uses machine learning to predict the likelihood of heart disease based on clinical factors.
                Get AI-powered insights in seconds.
              </p>
              <Link href="/predict">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">Why Choose Healigram?</h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card border border-border rounded-lg p-8">
                <div className="text-3xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Instant Results</h3>
                <p className="text-muted-foreground">
                  Get predictions in seconds with our advanced machine learning model trained on clinical data.
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-8">
                <div className="text-3xl mb-4">🔒</div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Secure & Private</h3>
                <p className="text-muted-foreground">
                  Your health data is encrypted and never stored. We prioritize your privacy above all.
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-8">
                <div className="text-3xl mb-4">📊</div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Evidence-Based</h3>
                <p className="text-muted-foreground">
                  Built on clinical research and validated against real-world medical data.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary text-primary-foreground py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Check Your Heart Health?</h2>
            <p className="text-lg mb-8 opacity-90">
              Take the first step towards better health awareness. Our prediction tool is free and takes just a few
              minutes.
            </p>
            <Link href="/predict">
              <Button size="lg" variant="secondary">
                Start Prediction
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
