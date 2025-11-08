import express from "express";
import cors from "cors";
import audioRouter from "./routes/audio.js";
import videoRouter from "./routes/video.js";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
app.use("/api/audio", audioRouter);
app.use("/api/video", videoRouter);
const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`stego API listening on :${port}`));
