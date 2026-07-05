import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { aiRouter } from "./routes/ai";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);
const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "http://localhost:8081";

app.use(
  cors({
    origin: allowedOrigin
  })
);
app.use(express.json({ limit: "256kb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/ai", aiRouter);

app.listen(port, () => {
  console.info(`[server] listening on http://localhost:${port}`);
});
