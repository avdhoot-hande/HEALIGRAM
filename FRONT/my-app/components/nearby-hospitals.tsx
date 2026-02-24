"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

export default function NearbyHospitalsMap() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
      },
      () => {
        setError("Location permission denied")
      }
    )
  }, [])

  if (error) {
    return (
      <Card className="p-4 mt-6 text-sm text-red-500">
        📍 {error}
      </Card>
    )
  }

  if (!coords) {
    return (
      <Card className="p-4 mt-6 text-sm text-muted-foreground">
        📍 Loading nearby hospitals…
      </Card>
    )
  }

  const mapSrc = `https://www.google.com/maps?q=hospitals+near+me&ll=${coords.lat},${coords.lng}&z=14&output=embed`

  return (
    <Card className="p-6 mt-6 border border-border">
      <h3 className="text-lg font-semibold mb-3">
        🏥 Nearby Hospitals
      </h3>

      <div className="w-full h-[350px] rounded overflow-hidden border">
        <iframe
          src={mapSrc}
          width="100%"
          height="100%"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <a
        href={`https://www.google.com/maps/search/hospitals/@${coords.lat},${coords.lng},14z`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-sm text-blue-600 hover:underline"
      >
        ➜ Open in Google Maps
      </a>
    </Card>
  )
}
