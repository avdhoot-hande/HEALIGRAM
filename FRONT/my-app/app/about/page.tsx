import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-foreground">About Healigram</h1>

          {/* Mission Section */}
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-primary">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Healigram is dedicated to making heart disease risk assessment accessible to everyone. We believe that
              early detection and awareness can save lives. By leveraging machine learning and clinical data, we provide
              instant, accurate predictions that empower individuals to take control of their health.
            </p>
          </section>

          {/* How It Works Section */}
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-primary">How It Works</h2>
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-2 text-foreground">1. Input Your Data</h3>
                <p className="text-muted-foreground">
                  Provide basic clinical information including age, blood pressure, cholesterol levels, and lifestyle
                  factors.
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-2 text-foreground">2. AI Analysis</h3>
                <p className="text-muted-foreground">
                  Our machine learning model analyzes your data against patterns from thousands of clinical cases.
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-2 text-foreground">3. Get Results</h3>
                <p className="text-muted-foreground">
                  Receive an instant prediction with confidence score and personalized health recommendations.
                </p>
              </div>
            </div>
          </section>

          {/* What We Analyze Section */}
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-primary">What We Analyze</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-secondary rounded-lg p-6">
                <h3 className="font-semibold mb-3 text-foreground">Clinical Factors</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Blood Pressure (Systolic & Diastolic)</li>
                  <li>• Cholesterol Levels</li>
                  <li>• Glucose Levels</li>
                  <li>• Age & Gender</li>
                </ul>
              </div>
              <div className="bg-secondary rounded-lg p-6">
                <h3 className="font-semibold mb-3 text-foreground">Lifestyle Factors</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Smoking Status</li>
                  <li>• Alcohol Consumption</li>
                  <li>• Physical Activity</li>
                  <li>• Body Metrics (Height & Weight)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Disclaimer Section */}
          <section className="bg-accent/10 border border-accent/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-foreground">Important Disclaimer</h3>
            <p className="text-muted-foreground">
              Healigram is a screening tool designed to provide insights based on clinical data. It is not a substitute
              for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare
              provider for medical concerns. Our predictions are for informational purposes only.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
