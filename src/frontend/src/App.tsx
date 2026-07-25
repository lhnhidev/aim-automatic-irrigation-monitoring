/* eslint-disable indent */
import React, { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Droplets,
  Thermometer,
  Sun,
  Wind,
  CloudSun,
  CloudRain,
  Cloud,
  CloudLightning,
  Sprout,
  Clock,
  Zap,
  Hand,
  Play,
  CalendarClock,
  BrainCircuit,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Wifi,
  WifiOff
} from "lucide-react"

import { type LucideIcon } from "lucide-react"

/* ------------------------------------------------------------------ */
/*  TYPES                                                             */
/* ------------------------------------------------------------------ */
type Mode = "auto" | "manual"
type ManualSubMode = "now" | "schedule"
type ForecastType = "cloudy" | "rain" | "storm" | "sun"
type PredictionStatus = "loading" | "done" | "error"

interface SensorData {
  soilMoisture: number
  soilTemp: number
  airTemp: number
  airHumidity: number
  lightIntensity: number
}

interface ForecastItem {
  time: string
  type: ForecastType
  temp: number
  rainChance: number
}

interface AiPrediction {
  shouldIrrigate: boolean
  confidence: number
  scheduledAt: string | null
  reason: string
}

interface ManualConfirmation {
  type: ManualSubMode
  at: Date
}

/* ------------------------------------------------------------------ */
/*  DESIGN TOKENS                                                     */
/* ------------------------------------------------------------------ */
const palette = {
  bgFrom: "#060B18",
  bgVia: "#0B1B2B",
  bgTo: "#081512"
}

/* ------------------------------------------------------------------ */
/*  1. BACKGROUND                                                     */
/* ------------------------------------------------------------------ */
const AmbientBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{
        background: `linear-gradient(160deg, ${palette.bgFrom}, ${palette.bgVia} 55%, ${palette.bgTo})`
      }}
    >
      <motion.div
        className="absolute -top-40 -left-32 h-130 w-130 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(16,185,129,0.35), transparent 70%)"
        }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-40 h-140 w-140 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(14,165,233,0.30), transparent 70%)"
        }}
        animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 left-1/4 h-120 w-120 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.22), transparent 70%)"
        }}
        animate={{ x: [0, 25, 0], y: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "26px 26px"
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  2. GLASS PANEL                                                    */
/* ------------------------------------------------------------------ */
interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <div
      className={
        "relative rounded-3xl border border-white/15 bg-white/6 backdrop-blur-xl " +
        "shadow-2xl shadow-black/20 " +
        className
      }
      {...props}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-3xl bg-linear-to-r from-transparent via-white/40 to-transparent" />
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  3. HEADER (Cập nhật hiển thị trạng thái Realtime)                 */
/* ------------------------------------------------------------------ */
interface DashboardHeaderProps {
  zoneName?: string
  isConnected: boolean
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  zoneName = "Khu vườn A1",
  isConnected
}) => {
  const [now, setNow] = useState<Date>(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 10)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl">
          <Sprout className="h-5 w-5 text-emerald-300" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Bảng điều khiển tưới tiêu
            </h1>
            {/* Đèn báo Realtime */}
            <span className="relative flex h-2.5 w-2.5">
              {isConnected && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  isConnected ? "bg-emerald-500" : "bg-red-500"
                }`}
              ></span>
            </span>
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-white/50">
            {zoneName} ·{" "}
            {isConnected ? "Đã kết nối Webots (3s)" : "Mất kết nối Webots"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-xl ${
            isConnected
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {isConnected ? (
            <Wifi className="h-3.5 w-3.5" />
          ) : (
            <WifiOff className="h-3.5 w-3.5" />
          )}
          {isConnected ? "LIVE" : "OFFLINE"}
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/70 backdrop-blur-xl">
          <Clock className="h-4 w-4" />
          {now.toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          })}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  4. SENSOR CARD & GRID                                             */
/* ------------------------------------------------------------------ */
interface SensorCardProps {
  icon: LucideIcon
  label: string
  value: number
  unit: string
  accent: string
  hint?: string
  delay?: number
}

const SensorCard: React.FC<SensorCardProps> = ({
  icon: Icon,
  label,
  value,
  unit,
  accent,
  hint,
  delay = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <GlassPanel className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white/60">{label}</span>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10"
            style={{ background: `${accent}22` }}
          >
            <Icon className="h-4 w-4" style={{ color: accent }} />
          </div>
        </div>
        <div className="flex items-end gap-1">
          {/* Hiệu ứng chuyển số mượt mà khi value đổi */}
          <motion.span
            key={value}
            initial={{ opacity: 0.5, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-semibold text-white"
          >
            {value}
          </motion.span>
          <span className="mb-0.5 text-sm text-white/50">{unit}</span>
        </div>
        {hint && <span className="text-xs text-white/40">{hint}</span>}
      </GlassPanel>
    </motion.div>
  )
}

const sensorIconMap: Record<ForecastType, LucideIcon> = {
  cloudy: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
  sun: CloudSun
}

interface SensorGridProps {
  data: SensorData
}

const SensorGrid: React.FC<SensorGridProps> = ({ data }) => {
  const cards: SensorCardProps[] = [
    {
      icon: Droplets,
      label: "Độ ẩm đất",
      value: data.soilMoisture,
      unit: "%",
      accent: "#38BDF8",
      hint:
        data.soilMoisture < 30
          ? "Đất đang khô"
          : data.soilMoisture <= 70
            ? "Độ ẩm đạt ngưỡng tối ưu"
            : "Đất đang quá ẩm / ngập nước"
    },
    {
      icon: Thermometer,
      label: "Nhiệt độ đất",
      value: data.soilTemp,
      unit: "°C",
      accent: "#F97316",
      hint:
        data.soilTemp < 18
          ? "Nhiệt độ đất lạnh"
          : data.soilTemp <= 32
            ? "Nhiệt độ đất lý tưởng"
            : "Đất đang khá nóng"
    },
    {
      icon: Wind,
      label: "Nhiệt độ không khí",
      value: data.airTemp,
      unit: "°C",
      accent: "#FB923C",
      hint:
        data.airTemp < 20
          ? "Thời tiết mát mẻ"
          : data.airTemp <= 34
            ? "Nhiệt độ môi trường ấm áp"
            : "Trời nắng nóng gắt"
    },
    {
      icon: Cloud,
      label: "Độ ẩm không khí",
      value: data.airHumidity,
      unit: "%",
      accent: "#22D3EE",
      hint:
        data.airHumidity < 40
          ? "Không khí khô hanh"
          : data.airHumidity <= 75
            ? "Độ ẩm không khí vừa phải"
            : "Độ ẩm cao, có thể sắp mưa"
    },
    {
      icon: Sun,
      label: "Cường độ ánh sáng",
      value: data.lightIntensity,
      unit: "lux",
      accent: "#FACC15",
      hint:
        data.lightIntensity < 50
          ? "Trời tối / Ban đêm"
          : data.lightIntensity < 10000
            ? "Ánh sáng yếu / Nhiều mây"
            : data.lightIntensity <= 40000
              ? "Ánh sáng mặt trời vừa"
              : "Nắng gắt ngoài trời"
    }
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c, i) => (
        <SensorCard key={c.label} {...c} delay={i * 0.05} />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  5. WEATHER FORECAST                                               */
/* ------------------------------------------------------------------ */
interface WeatherForecastCardProps {
  // Tọa độ tùy chỉnh (Mặc định: Hà Nội / TP.HCM hoặc lấy từ GPS)
  latitude?: number
  longitude?: number
}

const WeatherForecastCard: React.FC<WeatherForecastCardProps> = ({
  latitude = 10.030198, // Toa do o Dai hoc Can Tho
  longitude = 105.764434
}) => {
  const [forecast, setForecast] = useState<ForecastItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)

  // Hàm chuyển đổi WMO Weather Code sang type icon giao diện
  const mapWmoCodeToType = (code: number): ForecastType => {
    if (code === 0 || code === 1) return "sun"
    if (code === 2 || code === 3) return "cloudy"
    if (code >= 51 && code <= 67) return "rain"
    if (code >= 80 && code <= 82) return "rain"
    if (code >= 95) return "storm"
    return "cloudy"
  }

  const fetchWeatherForecast = useCallback(async () => {
    try {
      setLoading(true)
      setError(false)

      // Gọi API Open-Meteo cho thời tiết trong ngày (hourly)
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation_probability,weather_code&timezone=auto&forecast_days=1`
      )

      if (!res.ok) throw new Error("Fetch weather failed")

      const data = await res.json()
      const hourly = data.hourly

      // Lấy giờ hiện tại để chỉ lọc ra các khung giờ từ thời điểm này trở đi (hoặc lấy giãn cách 3 tiếng/lần)
      const currentHour = new Date().getHours()

      const formattedForecast: ForecastItem[] = []

      // Lặp qua các mốc giờ trong ngày (lấy 6 mốc thời gian tiếp theo, mỗi mốc cách nhau 3 tiếng)
      for (let i = 0; i < hourly.time.length; i += 3) {
        const dateObj = new Date(hourly.time[i])
        const hour = dateObj.getHours()

        // Bỏ qua các giờ đã qua trong quá khứ của ngày hôm nay
        if (hour < currentHour && currentHour - hour > 2) continue

        formattedForecast.push({
          time: `${hour.toString().padStart(2, "0")}:00`,
          type: mapWmoCodeToType(hourly.weather_code[i]),
          temp: Math.round(hourly.temperature_2m[i]),
          rainChance: hourly.precipitation_probability[i] || 0
        })

        if (formattedForecast.length >= 6) break // Chỉ lấy tối đa 6 khung giờ hiển thị
      }

      setForecast(formattedForecast)
    } catch (err) {
      console.error("Lỗi lấy dữ liệu thời tiết:", err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [latitude, longitude])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWeatherForecast()

    // Cập nhật lại dự báo thời tiết mỗi 30 phút
    const interval = setInterval(fetchWeatherForecast, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchWeatherForecast])

  return (
    <GlassPanel className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/70">
          Dự báo thời tiết (Đại học Cần Thơ)
        </h3>
        <CloudSun className="h-4 w-4 text-white/40" />
      </div>

      {loading ? (
        <div className="flex h-24 items-center justify-center gap-2 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin text-sky-300" />
          Đang tải dự báo thời tiết...
        </div>
      ) : error ? (
        <div className="flex h-24 items-center justify-center text-xs text-red-300">
          Không thể lấy dữ liệu thời tiết.
          <button onClick={fetchWeatherForecast} className="ml-2 underline">
            Thử lại
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {forecast.map((f, i) => {
            const Icon = sensorIconMap[f.type] || CloudSun
            return (
              <div
                key={i}
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-2 py-3"
              >
                <span className="text-xs text-white/45">{f.time}</span>
                <Icon className="h-5 w-5 text-sky-300" />
                <span className="text-sm font-medium text-white">
                  {f.temp}°C
                </span>
                <span className="text-[11px] text-white/40">
                  {f.rainChance}% mưa
                </span>
              </div>
            )
          })}
        </div>
      )}
    </GlassPanel>
  )
}

/* ------------------------------------------------------------------ */
/*  6. MODE TOGGLE                                                    */
/* ------------------------------------------------------------------ */
interface ModeToggleProps {
  mode: Mode
  // eslint-disable-next-line no-unused-vars
  onChange: (mode: Mode) => void
}

const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onChange }) => {
  const modes: Mode[] = ["auto", "manual"]

  return (
    <div className="relative flex rounded-2xl border border-white/15 bg-white/5 p-1 backdrop-blur-xl">
      {modes.map((m) => {
        const active = mode === m
        return (
          <button
            key={m}
            onClick={() => onChange(m)}
            className="relative z-10 flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
            style={{ color: active ? "#06251c" : "rgba(255,255,255,0.65)" }}
          >
            {active && (
              <motion.span
                layoutId="mode-pill"
                className="absolute inset-0 -z-10 rounded-xl"
                style={{
                  background:
                    m === "auto"
                      ? "linear-gradient(135deg, #34D399, #22D3EE)"
                      : "linear-gradient(135deg, #A78BFA, #38BDF8)"
                }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            {m === "auto" ? (
              <BrainCircuit className="h-4 w-4" />
            ) : (
              <Hand className="h-4 w-4" />
            )}
            {m === "auto" ? "Tưới tự động (AI)" : "Tưới thủ công"}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  7. AUTO MODE PANEL                                                */
/* ------------------------------------------------------------------ */
const mockFetchAiPrediction = async (): Promise<AiPrediction> => {
  await new Promise((resolve) => setTimeout(resolve, 800))
  const shouldIrrigate = Math.random() > 0.5
  return {
    shouldIrrigate,
    confidence: Math.round(70 + Math.random() * 25),
    scheduledAt: shouldIrrigate
      ? new Date(Date.now() + 1000 * 60 * 35).toISOString()
      : null,
    reason: shouldIrrigate
      ? "Độ ẩm đất dưới ngưỡng tối ưu và nắng gắt ngoài trời."
      : "Độ ẩm đất và dự báo thời tiết cho thấy chưa cần tưới lúc này."
  }
}

const AutoModePanel: React.FC = () => {
  const [status, setStatus] = useState<PredictionStatus>("loading")
  const [prediction, setPrediction] = useState<AiPrediction | null>(null)

  const runPrediction = async (): Promise<void> => {
    setStatus("loading")
    try {
      const data = await mockFetchAiPrediction()
      setPrediction(data)
      setStatus("done")
    } catch (e) {
      setStatus("error")
      console.log(e)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    runPrediction()
  }, [])

  return (
    <GlassPanel className="flex flex-col gap-5 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-linear-to-br from-emerald-400/20 to-sky-400/20">
          <BrainCircuit className="h-5 w-5 text-emerald-300" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-white">
            Trợ lý AI tưới tiêu
          </h3>
          <p className="text-xs text-white/45">
            Phân tích dữ liệu cảm biến theo thời gian thực
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-6"
          >
            <Loader2 className="h-5 w-5 animate-spin text-sky-300" />
            <span className="text-sm text-white/60">
              AI đang phân tích dữ liệu cảm biến...
            </span>
          </motion.div>
        )}

        {status === "done" && prediction && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div
              className="flex items-start gap-3 rounded-2xl border px-4 py-4"
              style={{
                borderColor: prediction.shouldIrrigate
                  ? "rgba(52,211,153,0.35)"
                  : "rgba(255,255,255,0.12)",
                background: prediction.shouldIrrigate
                  ? "rgba(52,211,153,0.08)"
                  : "rgba(255,255,255,0.04)"
              }}
            >
              {prediction.shouldIrrigate ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              ) : (
                <Droplets className="mt-0.5 h-5 w-5 shrink-0 text-white/40" />
              )}
              <div>
                <p className="text-sm font-medium text-white">
                  {prediction.shouldIrrigate
                    ? "AI khuyến nghị nên tưới nước"
                    : "AI khuyến nghị chưa cần tưới"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">
                  {prediction.reason}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs text-white/40">Độ tin cậy</p>
                <p className="text-lg font-semibold text-white">
                  {prediction.confidence}%
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs text-white/40">Thời điểm dự kiến</p>
                <p className="text-lg font-semibold text-white">
                  {prediction.scheduledAt
                    ? new Date(prediction.scheduledAt).toLocaleTimeString(
                        "vi-VN",
                        {
                          hour: "2-digit",
                          minute: "2-digit"
                        }
                      )
                    : "—"}
                </p>
              </div>
            </div>

            <button
              onClick={runPrediction}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm text-white/70 transition hover:bg-white/10"
            >
              <ChevronRight className="h-4 w-4" />
              Yêu cầu AI phân tích lại
            </button>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-4 text-sm text-red-200"
          >
            Không thể kết nối tới AI. Vui lòng thử lại.
            <button onClick={runPrediction} className="ml-2 underline">
              Thử lại
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassPanel>
  )
}

/* ------------------------------------------------------------------ */
/*  8. MANUAL MODE PANEL                                              */
/* ------------------------------------------------------------------ */
const ManualModePanel: React.FC = () => {
  const [subMode, setSubMode] = useState<ManualSubMode>("now")
  const [scheduledTime, setScheduledTime] = useState<string>("")
  const [confirmed, setConfirmed] = useState<ManualConfirmation | null>(null)
  const [loading, setLoading] = useState(false)

  const minDateTime = useMemo<string>(() => {
    // eslint-disable-next-line react-hooks/purity
    const d = new Date(Date.now() + 60 * 1000)
    d.setSeconds(0, 0)
    return d.toISOString().slice(0, 16)
  }, [])

  const handleIrrigateNow = async () => {
    localStorage.setItem(
      "button",
      localStorage.getItem("button") === "Tưới ngay bây giờ"
        ? "Dừng tưới"
        : "Tưới ngay bây giờ"
    )
    setLoading(true)
    try {
      // Gọi API Backend (Thay URL theo đúng route backend của bạn)
      const response = await fetch("http://localhost:3000/api/water", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "START_WATERING" }) // Hoặc 'TOGGLE_WATERING'
      })

      const data = await response.json()

      if (response.ok) {
        alert(" Bắt đầu tưới nước thành công!")
      } else {
        alert(`❌ Lỗi: ${data.message || "Không thể bật tưới nước"}`)
      }
    } catch (error) {
      console.error("Lỗi khi gọi API tưới nước:", error)
      alert("❌ Không thể kết nối tới Server Backend!")
    } finally {
      setLoading(false)
    }
  }

  const handleSchedule = (): void => {
    if (!scheduledTime) return
    setConfirmed({ type: "schedule", at: new Date(scheduledTime) })
  }

  localStorage.setItem("button", "Tưới ngay bây giờ")

  return (
    <GlassPanel className="flex flex-col gap-5 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-linear-to-br from-violet-400/20 to-sky-400/20">
          <Hand className="h-5 w-5 text-violet-300" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-white">
            Điều khiển thủ công
          </h3>
          <p className="text-xs text-white/45">
            Bạn tự quyết định thời điểm tưới
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setSubMode("now")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm transition ${
            subMode === "now"
              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
              : "border-white/10 bg-white/5 text-white/55 hover:bg-white/10"
          }`}
        >
          <Play className="h-3.5 w-3.5" />
          Tưới ngay
        </button>
        <button
          onClick={() => setSubMode("schedule")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm transition ${
            subMode === "schedule"
              ? "border-sky-400/40 bg-sky-400/10 text-sky-200"
              : "border-white/10 bg-white/5 text-white/55 hover:bg-white/10"
          }`}
        >
          <CalendarClock className="h-3.5 w-3.5" />
          Hẹn giờ
        </button>
      </div>

      <AnimatePresence mode="wait">
        {subMode === "now" ? (
          <motion.div
            key="now"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            <p className="text-xs leading-relaxed text-white/45">
              Hệ thống sẽ kích hoạt van tưới ngay lập tức trong khu vực hiện
              tại.
            </p>
            <button
              onClick={handleIrrigateNow}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-400 to-sky-400 px-4 py-3 text-sm font-semibold text-[#06251c] shadow-lg shadow-emerald-500/20 transition active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {loading ? "Đang gửi lệnh..." : "Bật / Tắt"}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="schedule"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            <label className="flex flex-col gap-2 text-xs text-white/50">
              Chọn thời điểm tưới trong tương lai
              <input
                type="datetime-local"
                min={minDateTime}
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white scheme-dark outline-none focus:border-sky-400/50"
              />
            </label>
            <button
              onClick={handleSchedule}
              disabled={!scheduledTime}
              className="flex items-center justify-center gap-2 rounded-xl border border-sky-400/40 bg-sky-400/10 py-3 text-sm font-semibold text-sky-200 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CalendarClock className="h-4 w-4" />
              Đặt lịch tưới
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmed && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-xs text-emerald-200"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {confirmed.type === "now"
              ? "Đã gửi lệnh tưới ngay."
              : `Đã đặt lịch tưới lúc ${confirmed.at.toLocaleString("vi-VN")}.`}
          </motion.div>
        )}
      </AnimatePresence>
    </GlassPanel>
  )
}

/* ------------------------------------------------------------------ */
/*  9. ROOT DASHBOARD (Tích hợp Fetch Realtime 3s)                     */
/* ------------------------------------------------------------------ */
const IrrigationDashboard: React.FC = () => {
  const [mode, setMode] = useState<Mode>("auto")
  const [isConnected, setIsConnected] = useState<boolean>(true)

  // State lưu thông số cảm biến realtime
  const [sensorData, setSensorData] = useState<SensorData>({
    soilMoisture: 0,
    soilTemp: 0,
    airTemp: 0,
    airHumidity: 0,
    lightIntensity: 0
  })

  // Hàm Fetch API lấy dữ liệu mô phỏng từ Server (đã nhận từ Webots qua MQTT/REST)
  const fetchRealtimeSensors = useCallback(async () => {
    try {
      // TODO: Thay đường dẫn API backend của bạn vào đây
      // const res = await fetch("http://localhost:5000/api/sensors/latest")
      // const data = await res.json()

      // GIA LẬP TRONG KHI BẠN CHƯA NỐI API BACKEND:
      // (Nhớ bỏ đoạn fake này khi đã nối với Database/Backend thật)
      const data: SensorData = {
        soilMoisture: Number((35 + Math.random() * 5).toFixed(1)),
        soilTemp: Number((26 + Math.random() * 2).toFixed(1)),
        airTemp: Number((30 + Math.random() * 3).toFixed(1)),
        airHumidity: Number((60 + Math.random() * 10).toFixed(1)),
        lightIntensity: Number((15000 + Math.random() * 50000).toFixed(0))
      }

      setSensorData(data)
      setIsConnected(true)
    } catch (error) {
      console.error("Lỗi khi fetch dữ liệu cảm biến:", error)
      setIsConnected(false)
    }
  }, [])

  // Hook Polling: Tự động chạy mỗi 3000ms (3 giây)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRealtimeSensors() // Gọi lần đầu ngay khi mount
    const interval = setInterval(fetchRealtimeSensors, 3000)

    return () => clearInterval(interval) // Clear timer khi unmount
  }, [fetchRealtimeSensors])

  const forecast: ForecastItem[] = [
    { time: "12h", type: "sun", temp: 33, rainChance: 5 },
    { time: "15h", type: "cloudy", temp: 31, rainChance: 20 },
    { time: "18h", type: "rain", temp: 28, rainChance: 65 },
    { time: "21h", type: "rain", temp: 26, rainChance: 40 },
    { time: "00h", type: "cloudy", temp: 25, rainChance: 15 },
    { time: "03h", type: "sun", temp: 24, rainChance: 5 }
  ]

  return (
    <div className="relative min-h-screen w-full px-4 py-8 sm:px-8 lg:px-12">
      <AmbientBackground />

      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <DashboardHeader isConnected={isConnected} />

        <SensorGrid data={sensorData} />

        <WeatherForecastCard forecast={forecast} />

        <div className="flex flex-col gap-4">
          <ModeToggle mode={mode} onChange={setMode} />

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {mode === "auto" ? <AutoModePanel /> : <ManualModePanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default IrrigationDashboard
