import "dotenv/config";

import express from "express";
import cors from "cors";
import compatibilityRoutes from "./routes/compatibility.routes.js";
import connectDB from "./config/db.js";
import connectCloudinary from "./config/cloudinary.js";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import interactionRoutes from "./routes/interaction.routes.js";
import matchRoutes from "./routes/match.routes.js";


const app = express();

const PORT = process.env.PORT || 5000;

connectDB();
connectCloudinary();

app.use(
  cors({
    origin: true,
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/interactions", interactionRoutes);
app.use(
  "/api/compatibility",
  compatibilityRoutes
);
app.use("/api/matches", matchRoutes);



app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Vibe API is running 🚀",
  });
});

app.listen(PORT, () => {
  console.log(`Vibe server running on port ${PORT}`);
});