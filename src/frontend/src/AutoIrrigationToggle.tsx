import React, { useState, useEffect, useRef } from "react"
import { Power, Loader2, Sparkles } from "lucide-react"

interface AutoIrrigationProps {
  sensorData: {
    soilMoisture: number
    soilTemp: number
    airTemp: number
    airHumidity: number
    lightIntensity: number
  }
}

export const AutoIrrigationToggle: React.FC<AutoIrrigationProps> = ({
  sensorData
}) => {
  const [isAutoMode, setIsAutoMode] = useState<boolean>(false)
  const [isChecking, setIsChecking] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<string>(
    "Chế độ tự động đang tắt"
  )

  // Dùng useRef để giữ tham chiếu mới nhất của sensorData trong setInterval
  const sensorDataRef = useRef(sensorData)
  useEffect(() => {
    sensorDataRef.current = sensorData
  }, [sensorData])

  // 1. Hàm lấy % khả năng mưa từ Open-Meteo
  const getRainProbability = async (): Promise<number> => {
    try {
      const latitude = 10.030198 // Đại học Cần Thơ
      const longitude = 105.764434
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=precipitation_probability&timezone=auto&forecast_days=1`
      )
      if (!res.ok) return 0

      const weatherData = await res.json()
      const hourlyTimes: string[] = weatherData.hourly.time
      const hourlyRainProb: number[] =
        weatherData.hourly.precipitation_probability

      const now = new Date()
      let closestIndex = hourlyTimes.findIndex((tStr) => new Date(tStr) >= now)
      if (closestIndex === -1) closestIndex = hourlyTimes.length - 1

      return hourlyRainProb[closestIndex] ?? 0
    } catch {
      return 0
    }
  }

  // 2. Hàm gọi API kích hoạt bật/tắt bơm
  const triggerWaterPump = async (
    action: "START_WATERING" | "STOP_WATERING"
  ) => {
    try {
      await fetch("http://localhost:3000/api/water/123", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      })
    } catch (err) {
      console.error("Lỗi điều khiển bơm:", err)
    }
  }

  // 3. Hàm cốt lõi: Kiểm tra AI & Quyết định tưới
  const checkAndIrrigate = async () => {
    setIsChecking(true)
    try {
      const rainPercent = await getRainProbability()
      const current = sensorDataRef.current

      const payload = {
        soil_moisture: current.soilMoisture,
        soil_temp: current.soilTemp,
        temp: current.airTemp,
        humidity: current.airHumidity,
        light: current.lightIntensity,
        rain_forecast: rainPercent
      }

      // Gọi API dự đoán AI
      const aiRes = await fetch(
        "http://localhost:3000/api/smart-irrigate-check",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      )

      const result = await aiRes.json()

      if (result.success && result.data) {
        const { should_water, message } = result.data

        if (should_water) {
          setStatusMessage(` AI khuyến nghị TƯỚI: ${message}`)
          await triggerWaterPump("START_WATERING") // Bật tưới
        } else {
          setStatusMessage(` AI khuyến nghị KHÔNG TƯỚI: ${message}`)
          await triggerWaterPump("STOP_WATERING") // Tắt/Giữ ngắt tưới
        }
      }
    } catch (error) {
      console.error("Lỗi khi chạy Auto Mode:", error)
      setStatusMessage("❌ Lỗi kết nối tới Server AI")
    } finally {
      setIsChecking(false)
    }
  }

  // 4. useEffect quản lý Vòng lặp 3 giây (Interval)
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (isAutoMode) {
      // Chạy ngay lần đầu tiên bấm kích hoạt
      checkAndIrrigate()

      // Thiết lập vòng lặp chạy mỗi 3000ms (3 giây)
      timer = setInterval(() => {
        checkAndIrrigate()
      }, 3000)
    } else {
      setStatusMessage("Chế độ tự động đang tắt")
    }

    // Dọn dẹp timer khi tắt chế độ Auto hoặc Component unmount
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isAutoMode])

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles
            className={`h-5 w-5 ${isAutoMode ? "animate-pulse text-emerald-400" : "text-white/40"}`}
          />
          <span className="text-sm font-semibold text-white">
            Tự động tưới thông minh (AI)
          </span>
        </div>

        {/* Nút Toggle Bật/Tắt Auto */}
        <button
          onClick={() => setIsAutoMode(!isAutoMode)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition active:scale-95 ${
            isAutoMode
              ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          <Power className="h-3.5 w-3.5" />
          {isAutoMode ? "ĐANG BẬT" : "ĐANG TẮT"}
        </button>
      </div>

      {/* Hiển thị Trạng thái */}
      <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-black/20 p-2.5 text-xs text-white/70">
        {isChecking && (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-sky-400" />
        )}
        <span className="truncate">{statusMessage}</span>
      </div>
    </div>
  )
}
