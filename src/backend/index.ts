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

app.listen(3000);
