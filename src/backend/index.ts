import express, { type Express, type Request, type Response } from "express";
import net from "net";
import cors from "cors";

const app: Express = express();

app.use(
  cors({
    origin: "*", // Cho phép mọi Frontend truy cập (hoặc điền "http://localhost:5173" / "http://localhost:3000")
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.post("/api/water", (req, res) => {
  const client = new net.Socket();
  client.connect(8888, "127.0.0.1", () => {
    client.write("TOGGLE_WATERING"); // Hoặc 'STOP_WATERING'
  });
  client.on("data", (data: any) => {
    res.json({ success: true, message: data.toString() });
    client.destroy();
  });
});

app.post("/api/smart-irrigate-check", async (req, res) => {
  try {
    // 1. Nhận dữ liệu cảm biến & thời tiết từ Frontend
    const { soil_moisture, soil_temp, temp, humidity, light, rain_forecast } =
      req.body;

    // 2. Gửi request sang Python AI Service (Port 5001)
    const aiResponse = await fetch("http://127.0.0.1:5001/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

    // 3. Trả kết quả của AI về cho Frontend
    res.json({
      success: true,
      data: aiResult,
    });
  } catch (error: any) {
    console.error("❌ Error calling AI Service:", error.message);
    res.status(500).json({
      success: false,
      message:
        "Không thể kết nối tới mô hình AI! Hãy đảm bảo ai_service.py đang chạy.",
      error: error.message,
    });
  }
});

app.listen(3000);
