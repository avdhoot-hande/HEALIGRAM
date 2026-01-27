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

    // Convert form data to API format
    const apiData = {
      age: Number.parseInt(formData.age),
      gender: formData.gender === "Male" ? 1 : 0,
      height: Number.parseInt(formData.height),
      weight: Number.parseInt(formData.weight),
      ap_hi: Number.parseInt(formData.ap_hi),
      ap_lo: Number.parseInt(formData.ap_lo),
      cholesterol: Number.parseInt(formData.cholesterol),
      gluc: Number.parseInt(formData.gluc),
      smoke: formData.smoke === "Yes" ? 1 : 0,
      alco: formData.alco === "Yes" ? 1 : 0,
      active: formData.active === "Yes" ? 1 : 0,
    }

    onSubmit(apiData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Age (years)</label>
        <input
          type="number"
          name="age"
          value={formData.age}
          onChange={handleChange}
          required
          min="1"
          max="120"
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="e.g., 45"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Gender</label>
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option>Male</option>
          <option>Female</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Height (cm)</label>
          <input
            type="number"
            name="height"
            value={formData.height}
            onChange={handleChange}
            required
            min="100"
            max="250"
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g., 175"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Weight (kg)</label>
          <input
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            required
            min="30"
            max="300"
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g., 75"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Systolic BP (ap_hi)</label>
          <input
            type="number"
            name="ap_hi"
            value={formData.ap_hi}
            onChange={handleChange}
            required
            min="50"
            max="250"
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g., 120"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Diastolic BP (ap_lo)</label>
          <input
            type="number"
            name="ap_lo"
            value={formData.ap_lo}
            onChange={handleChange}
            required
            min="30"
            max="150"
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g., 80"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Cholesterol (1-3)</label>
          <select
            name="cholesterol"
            value={formData.cholesterol}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="1">Normal (1)</option>
            <option value="2">Above Normal (2)</option>
            <option value="3">High (3)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">gluc (1-3)</label>
          <select
            name="gluc"
            value={formData.gluc}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="1">Normal (1)</option>
            <option value="2">Above Normal (2)</option>
            <option value="3">High (3)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Smoke</label>
          <select
            name="smoke"
            value={formData.smoke}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option>Yes</option>
            <option>No</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Alcohol</label>
          <select
            name="alco"
            value={formData.alco}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option>Yes</option>
            <option>No</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Active</label>
          <select
            name="active"
            value={formData.active}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option>Yes</option>
            <option>No</option>
          </select>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2"
      >
        {loading ? "Analyzing..." : "Get Prediction"}
      </Button>
    </form>
  )
}
