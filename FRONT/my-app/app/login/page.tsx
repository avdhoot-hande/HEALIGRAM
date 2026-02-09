"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AuthForm } from "@/components/ui/auth-form"
import { useEffect, useRef, useState } from "react"
import { useLanguage } from "@/context/LanguageContext"
import { translations } from "@/lib/translations"

export default function LoginPage() {
  const { language } = useLanguage()
  const t = translations[language]

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<"login" | "signup">("login")

  /* ===============================
     CURSOR AURA
  =============================== */
  useEffect(() => {
    const glow = glowRef.current!
    const move = (e: MouseEvent) => {
      glow.style.background = `
        radial-gradient(
          500px at ${e.clientX}px ${e.clientY}px,
          rgba(99,102,241,0.18),
          transparent 60%
        )
      `
    }
    window.addEventListener("mousemove", move)
    return () => window.removeEventListener("mousemove", move)
  }, [])

  /* ===============================
     PARTICLES
  =============================== */
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const mouse = { x: -9999, y: -9999 }
    window.addEventListener("mousemove", e => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    })

    const particles = Array.from({ length: 260 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 1,
      a: Math.random() * Math.PI * 2,
      s: Math.random() * 0.4 + 0.15,
    }))

    let t0 = 0
    let raf: number

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.globalCompositeOperation = "lighter"
      t0 += 0.005

      particles.forEach((p, i) => {
        p.a += p.s * 0.01
        p.x += Math.sin(p.a + t0) * 0.35
        p.y += Math.cos(p.a + t0) * 0.35

        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const d = Math.sqrt(dx * dx + dy * dy)

        if (d < 160) {
          p.x += dx / d
          p.y += dy / d
        }

        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 18)
        g.addColorStop(0, "rgba(59,130,246,0.55)")
        g.addColorStop(1, "rgba(59,130,246,0)")

        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2)
        ctx.fill()

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y)
          if (dist < 120) {
            ctx.strokeStyle = `rgba(99,102,241,${0.12 - dist / 1000})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }
      })

      ctx.globalCompositeOperation = "source-over"
      raf = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50 text-slate-900">
      <canvas ref={canvasRef} className="absolute inset-0 -z-20" />
      <div ref={glowRef} className="pointer-events-none absolute inset-0 transition duration-300" />

      <Navbar />

      <main className="relative z-10 flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
        <div className="relative w-full max-w-md group">
          <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-blue-400/50 via-indigo-400/50 to-sky-400/50 blur-2xl opacity-80 group-hover:opacity-100 transition" />

          <div className="relative rounded-[2rem] border bg-white/90 backdrop-blur-2xl p-10 shadow-xl">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-semibold">Healigram</h1>
              <p className="mt-2 text-sm text-slate-500">
                {mode === "login" ? t.loginWelcome : t.signupWelcome}
              </p>
            </div>

            {/* TOGGLE */}
            <div className="mb-6 flex rounded-full bg-slate-100 p-1 text-sm">
              {(["login", "signup"] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setMode(v)}
                  className={`flex-1 rounded-full py-2 transition ${
                    mode === v
                      ? "bg-white shadow text-slate-900"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {v === "login" ? t.login : t.signup}
                </button>
              ))}
            </div>

            <AuthForm mode={mode} />

            <p className="mt-6 text-center text-xs text-slate-400">
              {t.authFooter}
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
