"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface PredictionFormProps {
  onSubmit: (data: Record<string, any>, file?: File) => void;
  loading: boolean;
}

export default function PredictionForm({
  onSubmit,
  loading,
}: PredictionFormProps) {
  const [ecgFile, setEcgFile] = useState<File | null>(null);

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
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
    };

    onSubmit(apiData, ecgFile || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground block">
          ECG Report Image
        </label>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setEcgFile(e.target.files?.[0] || null)}
          className="w-full"
        />
      </div>
      {/* Personal Information Section */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Age */}
          <div className="space-y-2">
            <label
              htmlFor="age"
              className="text-sm font-medium text-foreground block"
            >
              Age <span className="text-destructive">*</span>
            </label>
            <input
              id="age"
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              required
              min="1"
              max="120"
              className="w-full px-3 py-2 bg-input border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              placeholder="e.g., 45"
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <label
              htmlFor="gender"
              className="text-sm font-medium text-foreground block"
            >
              Gender <span className="text-destructive">*</span>
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-input border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition cursor-pointer"
            >
              <option>Male</option>
              <option>Female</option>
            </select>
          </div>
        </div>
      </div>

      {/* Physical Measurements Section */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="height"
              className="text-sm font-medium text-foreground block"
            >
              Height (cm) <span className="text-destructive">*</span>
            </label>
            <input
              id="height"
              type="number"
              name="height"
              value={formData.height}
              onChange={handleChange}
              required
              min="100"
              max="250"
              className="w-full px-3 py-2 bg-input border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              placeholder="e.g., 175"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="weight"
              className="text-sm font-medium text-foreground block"
            >
              Weight (kg) <span className="text-destructive">*</span>
            </label>
            <input
              id="weight"
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              required
              min="30"
              max="300"
              className="w-full px-3 py-2 bg-input border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              placeholder="e.g., 75"
            />
          </div>
        </div>
      </div>

      {/* Blood Pressure Section */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="ap_hi"
              className="text-sm font-medium text-foreground block"
            >
              Systolic (mmHg) <span className="text-destructive">*</span>
            </label>
            <input
              id="ap_hi"
              type="number"
              name="ap_hi"
              value={formData.ap_hi}
              onChange={handleChange}
              required
              min="50"
              max="250"
              className="w-full px-3 py-2 bg-input border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              placeholder="e.g., 120"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="ap_lo"
              className="text-sm font-medium text-foreground block"
            >
              Diastolic (mmHg) <span className="text-destructive">*</span>
            </label>
            <input
              id="ap_lo"
              type="number"
              name="ap_lo"
              value={formData.ap_lo}
              onChange={handleChange}
              required
              min="30"
              max="150"
              className="w-full px-3 py-2 bg-input border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              placeholder="e.g., 80"
            />
          </div>
        </div>
      </div>

      {/* Lab Results Section */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="cholesterol"
              className="text-sm font-medium text-foreground block"
            >
              Cholesterol Level
            </label>
            <select
              id="cholesterol"
              name="cholesterol"
              value={formData.cholesterol}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-input border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition cursor-pointer"
            >
              <option value="1">Normal</option>
              <option value="2">Above Normal</option>
              <option value="3">High</option>
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="gluc"
              className="text-sm font-medium text-foreground block"
            >
              Glucose Level
            </label>
            <select
              id="gluc"
              name="gluc"
              value={formData.gluc}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-input border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition cursor-pointer"
            >
              <option value="1">Normal</option>
              <option value="2">Above Normal</option>
              <option value="3">High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lifestyle Factors Section */}
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <label
              htmlFor="smoke"
              className="text-sm font-medium text-foreground block"
            >
              Smoking
            </label>
            <select
              id="smoke"
              name="smoke"
              value={formData.smoke}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-input border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition cursor-pointer"
            >
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="alco"
              className="text-sm font-medium text-foreground block"
            >
              Alcohol
            </label>
            <select
              id="alco"
              name="alco"
              value={formData.alco}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-input border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition cursor-pointer"
            >
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="active"
              className="text-sm font-medium text-foreground block"
            >
              Active
            </label>
            <select
              id="active"
              name="active"
              value={formData.active}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-input border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition cursor-pointer"
            >
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full mt-8">
        {loading ? "Analyzing..." : "Get Prediction"}
      </Button>
    </form>
  );
}
