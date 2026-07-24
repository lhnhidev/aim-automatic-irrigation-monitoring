/* eslint-disable indent */
import React, { useState, useEffect, useMemo } from "react"
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
  ChevronRight
} from "lucide-react"

import { type LucideIcon } from "lucide-react"

/* ------------------------------------------------------------------ */
/*  TYPES                                                               */
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
/*  DESIGN TOKENS                                                      */
/*  Bảng màu: nền đêm nông trại (deep indigo -> teal), điểm nhấn        */
/*  emerald cho "sự sống / nước" và violet cho "AI".                    */
/* ------------------------------------------------------------------ */
const palette = {
  bgFrom: "#060B18",
  bgVia: "#0B1B2B",
  bgTo: "#081512"
}

/* ------------------------------------------------------------------ */
/*  1. BACKGROUND — dải màu loang (gradient blobs) phía sau lớp kính    */
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
      {/* lưới điểm mờ để tăng chiều sâu, gợi nhắc "ruộng đồng" */}
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
/*  2. GLASS PANEL — khối kính mờ dùng chung cho mọi card               */
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
      {/* viền sáng mảnh phía trên để giả lập ánh phản chiếu trên kính */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-3xl bg-linear-to-r from-transparent via-white/40 to-transparent" />
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  3. HEADER                                                          */
/* ------------------------------------------------------------------ */
interface DashboardHeaderProps {
  zoneName?: string
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  zoneName = "Khu vườn A1"
}) => {
  const [now, setNow] = useState<Date>(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 30)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl">
          <Sprout className="h-5 w-5 text-emerald-300" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Bảng điều khiển tưới tiêu
          </h1>
          <p className="text-sm text-white/50">
            {zoneName} · cập nhật trực tiếp
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/70 backdrop-blur-xl sm:self-auto">
        <Clock className="h-4 w-4" />
        {now.toLocaleString("vi-VN", {
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "2-digit"
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  4. SENSOR CARD — 1 card cho mỗi thông số cảm biến                   */
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
          <span className="text-3xl font-semibold text-white">{value}</span>
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
      hint: data.soilMoisture < 30 ? "Đất đang khô" : "Trong ngưỡng ổn định"
    },
    {
      icon: Thermometer,
      label: "Nhiệt độ đất",
      value: data.soilTemp,
      unit: "°C",
      accent: "#F97316",
      hint: "Đo tại độ sâu 10cm"
    },
    {
      icon: Wind,
      label: "Nhiệt độ không khí",
      value: data.airTemp,
      unit: "°C",
      accent: "#FB923C",
      hint: "Cảm biến ngoài trời"
    },
    {
      icon: Cloud,
      label: "Độ ẩm không khí",
      value: data.airHumidity,
      unit: "%",
      accent: "#22D3EE",
      hint: "Trung bình 10 phút gần nhất"
    },
    {
      icon: Sun,
      label: "Cường độ ánh sáng",
      value: data.lightIntensity,
      unit: "klux",
      accent: "#FACC15",
      hint: data.lightIntensity > 50 ? "Nắng gắt" : "Ánh sáng dịu"
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
/*  5. WEATHER FORECAST                                                 */
/* ------------------------------------------------------------------ */
interface WeatherForecastCardProps {
  forecast: ForecastItem[]
}

const WeatherForecastCard: React.FC<WeatherForecastCardProps> = ({
  forecast
}) => {
  return (
    <GlassPanel className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/70">Dự báo thời tiết</h3>
        <CloudSun className="h-4 w-4 text-white/40" />
      </div>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
        {forecast.map((f, i) => {
          const Icon = sensorIconMap[f.type] || CloudSun
          return (
            <div
              key={i}
              className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-2 py-3"
            >
              <span className="text-xs text-white/45">{f.time}</span>
              <Icon className="h-5 w-5 text-sky-300" />
              <span className="text-sm font-medium text-white">{f.temp}°</span>
              <span className="text-[11px] text-white/40">
                {f.rainChance}% mưa
              </span>
            </div>
          )
        })}
      </div>
    </GlassPanel>
  )
}

/* ------------------------------------------------------------------ */
/*  6. MODE TOGGLE — chuyển Tự động / Thủ công                          */
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
/*  7. AUTO MODE PANEL — gọi API AI để lấy khuyến nghị tưới              */
/*     Thay hàm mockFetchAiPrediction bằng lệnh gọi API thật của bạn.    */
/* ------------------------------------------------------------------ */
const mockFetchAiPrediction = async (): Promise<AiPrediction> => {
  await new Promise((resolve) => setTimeout(resolve, 1400))
  const shouldIrrigate = Math.random() > 0.5
  return {
    shouldIrrigate,
    confidence: Math.round(70 + Math.random() * 25),
    scheduledAt: shouldIrrigate
      ? new Date(Date.now() + 1000 * 60 * 35).toISOString()
      : null,
    reason: shouldIrrigate
      ? "Độ ẩm đất dưới ngưỡng tối ưu và trời sắp nắng gắt."
      : "Độ ẩm đất và dự báo mưa cho thấy chưa cần tưới lúc này."
  }
}

const AutoModePanel: React.FC = () => {
  const [status, setStatus] = useState<PredictionStatus>("loading")
  const [prediction, setPrediction] = useState<AiPrediction | null>(null)

  const runPrediction = async (): Promise<void> => {
    setStatus("loading")
    try {
      // TODO: thay bằng API thật, ví dụ:
      // const res = await fetch("/api/ai/irrigation-predict", { method: "POST" });
      // const data: AiPrediction = await res.json();
      const data = await mockFetchAiPrediction()
      setPrediction(data)
      setStatus("done")
    } catch (e) {
      setStatus("error")
      // eslint-disable-next-line no-console
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
/*  8. MANUAL MODE PANEL — tưới ngay hoặc hẹn giờ                       */
/* ------------------------------------------------------------------ */
const ManualModePanel: React.FC = () => {
  const [subMode, setSubMode] = useState<ManualSubMode>("now")
  const [scheduledTime, setScheduledTime] = useState<string>("")
  const [confirmed, setConfirmed] = useState<ManualConfirmation | null>(null)

  const minDateTime = useMemo<string>(() => {
    // eslint-disable-next-line react-hooks/purity
    const d = new Date(Date.now() + 60 * 1000)
    d.setSeconds(0, 0)
    return d.toISOString().slice(0, 16)
  }, [])

  const handleIrrigateNow = (): void => {
    // TODO: gọi API tưới ngay thật, ví dụ: fetch('/api/irrigation/now', { method: 'POST' })
    setConfirmed({ type: "now", at: new Date() })
  }

  const handleSchedule = (): void => {
    // eslint-disable-next-line curly
    if (!scheduledTime) return
    // TODO: gọi API đặt lịch thật, ví dụ:
    // fetch('/api/irrigation/schedule', { method: 'POST', body: JSON.stringify({ at: scheduledTime }) })
    setConfirmed({ type: "schedule", at: new Date(scheduledTime) })
  }

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

      {/* chọn: tưới ngay / hẹn giờ */}
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
              className="flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-400 to-sky-400 py-3 text-sm font-semibold text-[#06251c] shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
            >
              <Zap className="h-4 w-4" />
              Tưới ngay bây giờ
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
/*  9. ROOT DASHBOARD                                                   */
/* ------------------------------------------------------------------ */
const IrrigationDashboard: React.FC = () => {
  const [mode, setMode] = useState<Mode>("auto")

  // Dữ liệu mẫu — thay bằng dữ liệu thật lấy từ API / websocket cảm biến
  const sensorData: SensorData = {
    soilMoisture: 42,
    soilTemp: 27,
    airTemp: 31,
    airHumidity: 64,
    lightIntensity: 58
  }

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
        <DashboardHeader />

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
