"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({
            email,
            password,
          })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                username, // ✅ SAVED HERE
              },
            },
          })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push("/predict")
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* USERNAME (ONLY FOR SIGNUP) */}
      {mode === "signup" && (
        <input
          type="text"
          placeholder="Username"
          required
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full rounded-xl border px-4 py-3"
        />
      )}

      <input
        type="email"
        placeholder="Email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full rounded-xl border px-4 py-3"
      />

      <input
        type="password"
        placeholder="Password"
        required
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full rounded-xl border px-4 py-3"
      />

      {error && (
        <p className="text-center text-sm text-red-500">{error}</p>
      )}

      <button
        disabled={loading}
        className="w-full rounded-xl bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 transition"
      >
        {loading
          ? "Please wait..."
          : mode === "login"
          ? "Login"
          : "Create account"}
      </button>
    </form>
  )
}
