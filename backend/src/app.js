import express from "express";
import cors from "cors";

import textRoutes from "./routes/textRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));


app.use("/api/text", textRoutes);
app.use("/api/image", imageRoutes);

export default app;