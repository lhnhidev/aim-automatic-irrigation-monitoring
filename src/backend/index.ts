import express, { type Express, type Request, type Response } from "express";
import net from "net";
import cors from "cors";
import mqtt from "mqtt";

const app: Express = express();
const PORT = 3000;

// --- 1. MIDDLEWARES ---
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

// --- 2. TYPES & IN-MEMORY DATABASE ---
interface SensorData {
  temperature: number | null;
  soil_moisture: number | null;
  humidity: number | null;
  light: number | null;
  last_updated: string | null;
  soil_temperature: number | null;
}

const latestSensorData: SensorData = {
  temperature: null,
  soil_moisture: null,
  humidity: null,
  light: null,
  last_updated: null,
  soil_temperature: null,
};

// --- 3. HTTP ROUTES (Đưa tất cả Route lên trên) ---

app.get("/", (req: Request, res: Response) => {
  res.send("Server Express đang hoạt động bình thường!");
});

// API lấy dữ liệu cảm biến mới nhất
app.get("/api/sensors", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      soilMoisture: latestSensorData.soil_moisture ?? 30.0,
      soilTemp: latestSensorData.soil_temperature ?? 25.0,
      airTemp: latestSensorData.temperature ?? 28.0,
      airHumidity: latestSensorData.humidity ?? 60.0,
      lightIntensity: latestSensorData.light ?? 5000,
      lastUpdated: latestSensorData.last_updated,
    },
  });
});

app.post("/api/water", (req: Request, res: Response) => {
  const client = new net.Socket();
  client.connect(8888, "127.0.0.1", () => {
    client.write("TOGGLE_WATERING");
  });
  client.on("data", (data: any) => {
    res.json({ success: true, message: data.toString() });
    client.destroy();
  });
  client.on("error", (err) => {
    res.status(500).json({
      success: false,
      message: "Lỗi kết nối ổ cắm Webots",
      error: err.message,
    });
  });
});

app.post("/api/water/123", (req: Request, res: Response) => {
  const client = new net.Socket();
  client.connect(8888, "127.0.0.1", () => {
    client.write(req.body.action || "START_WATERING");
  });
  client.on("data", (data: any) => {
    res.json({ success: true, message: data.toString() });
    client.destroy();
  });
  client.on("error", (err) => {
    res.status(500).json({
      success: false,
      message: "Lỗi kết nối ổ cắm Webots",
      error: err.message,
    });
  });
});

app.post("/api/smart-irrigate-check", async (req: Request, res: Response) => {
  try {
    const { soil_moisture, soil_temp, temp, humidity, light, rain_forecast } =
      req.body;

    const aiResponse = await fetch("http://127.0.0.1:5001/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        soil_moisture,
        soil_temp,
        temp,
        humidity,
        light,
        rain_forecast,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error("AI Service returned error");
    }

    const aiResult = await aiResponse.json();
    res.json({ success: true, data: aiResult });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("❌ Error calling AI Service:", msg);
    res.status(500).json({
      success: false,
      message:
        "Không thể kết nối tới mô hình AI! Hãy đảm bảo ai_service.py đang chạy.",
      error: msg,
    });
  }
});

// --- 4. CẤU HÌNH MQTT CLIENT ---
const MQTT_BROKER = "mqtt://localhost:1883";

const mqttClient = mqtt.connect(MQTT_BROKER, {
  clientId: `Backend_NodeJS_${Math.random().toString(16).substring(2, 8)}`,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 2000,
});

mqttClient.on("connect", () => {
  console.log("✅ [MQTT] Kết nối thành công tới Broker:", MQTT_BROKER);

  const TOPICS = [
    "garden/sensor/temperature",
    "garden/sensor/soil_moisture",
    "garden/sensor/humidity",
    "garden/sensor/light",
    "garden/sensor/soil_temperature",
  ];

  mqttClient.subscribe(TOPICS, (err) => {
    if (!err) {
      console.log("📡 [MQTT] Đã Subscribe thành công các topic:", TOPICS);
    } else {
      console.error("❌ Lỗi khi Subscribe topic:", err);
    }
  });
});

mqttClient.on("error", (err) => {
  console.error("❌ [MQTT Error]:", err.message);
});

mqttClient.on("message", (topic, message) => {
  try {
    const rawData = message.toString();
    const parsedData = JSON.parse(rawData);

    console.log(`📩 Recv [${topic}]:`, parsedData);

    if (topic === "garden/sensor/temperature") {
      latestSensorData.temperature = parsedData.temperature ?? parsedData.value;
    } else if (topic === "garden/sensor/soil_moisture") {
      latestSensorData.soil_moisture =
        parsedData.soil_moisture ?? parsedData.value;
    } else if (topic === "garden/sensor/humidity") {
      latestSensorData.humidity = parsedData.humidity ?? parsedData.value;
    } else if (topic === "garden/sensor/light") {
      latestSensorData.light = parsedData.light_intensity ?? parsedData.value;
    } else if (topic === "garden/sensor/soil_temperature") {
      latestSensorData.soil_temperature =
        parsedData.soil_temperature ?? parsedData.value;
    }

    latestSensorData.last_updated = new Date().toISOString();
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Lỗi Parse MQTT:", error.message);
    }
  }
});

// --- 5. KHỞI CHẠY SERVER ---
app.listen(PORT, () => {
  console.log(`🚀 Server Express đang chạy tại: http://localhost:${PORT}`);
  console.log(`🔗 Thử kiểm tra API: http://localhost:${PORT}/api/sensors`);
});
