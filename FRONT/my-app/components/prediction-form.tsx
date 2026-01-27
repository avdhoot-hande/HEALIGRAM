"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface PredictionFormProps {
  onSubmit: (data: Record<string, any>) => void
  loading: boolean
}

export default function PredictionForm({ onSubmit, loading }: PredictionFormProps) {
  const [formData, setFormData] = useState({
    age: "",
    gender: "Male",
    height: "",
    weight: "",
    ap_hi: "",
    ap_lo: "",
    cholesterol: "1",
    gluc: "1",
    smoke: "No",
    alco: "No",
    active: "Yes",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // ✅ BACKEND-COMPATIBLE PAYLOAD
    const apiData = {
      // send age in DAYS (model trained this way)
      age: Math.round(Number(formData.age) * 365.25),

      // backend expects: 1 = male, 2 = female
      gender: formData.gender === "Male" ? 1 : 2,

      height: Number(formData.height),
      weight: Number(formData.weight),
      ap_hi: Number(formData.ap_hi),
      ap_lo: Number(formData.ap_lo),

      cholesterol: Number(formData.cholesterol),
      gluc: Number(formData.gluc),

      smoke: formData.smoke === "Yes" ? 1 : 0,
      alco: formData.alco === "Yes" ? 1 : 0,
      active: formData.active === "Yes" ? 1 : 0,
    }

    onSubmit(apiData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Age */}
      <div>
        <label className="block text-sm font-medium mb-1">Age (years)</label>
        <input
          type="number"
          name="age"
          value={formData.age}
          onChange={handleChange}
          required
          min="1"
          max="120"
          className="w-full px-3 py-2 border rounded-md"
          placeholder="e.g., 45"
        />
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-medium mb-1">Gender</label>
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md"
        >
          <option>Male</option>
          <option>Female</option>
        </select>
      </div>

      {/* Height / Weight */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Height (cm)</label>
          <input
            type="number"
            name="height"
            value={formData.height}
            onChange={handleChange}
            required
            min="100"
            max="250"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Weight (kg)</label>
          <input
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            required
            min="30"
            max="300"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      {/* BP */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Systolic BP</label>
          <input
            type="number"
            name="ap_hi"
            value={formData.ap_hi}
            onChange={handleChange}
            required
            min="50"
            max="250"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Diastolic BP</label>
          <input
            type="number"
            name="ap_lo"
            value={formData.ap_lo}
            onChange={handleChange}
            required
            min="30"
            max="150"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      {/* Cholesterol / Glucose */}
      <div className="grid grid-cols-2 gap-4">
        <select name="cholesterol" value={formData.cholesterol} onChange={handleChange}>
          <option value="1">Cholesterol Normal</option>
          <option value="2">Above Normal</option>
          <option value="3">High</option>
        </select>

        <select name="gluc" value={formData.gluc} onChange={handleChange}>
          <option value="1">Glucose Normal</option>
          <option value="2">Above Normal</option>
          <option value="3">High</option>
        </select>
      </div>

      {/* Lifestyle */}
      <div className="grid grid-cols-3 gap-3">
        <select name="smoke" value={formData.smoke} onChange={handleChange}>
          <option>Yes</option>
          <option>No</option>
        </select>

        <select name="alco" value={formData.alco} onChange={handleChange}>
          <option>Yes</option>
          <option>No</option>
        </select>

        <select name="active" value={formData.active} onChange={handleChange}>
          <option>Yes</option>
          <option>No</option>
        </select>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Analyzing..." : "Get Prediction"}
      </Button>
    </form>
  )
}
