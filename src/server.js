import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import { registerCallSocket } from "./socket/call.socket.js";

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
import chatRoutes from "./routes/chat.routes.js";
import callRoutes from "./routes/call.routes.js";
import blockRoutes from "./routes/block.routes.js";


const app = express();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});
app.set("io", io);

registerCallSocket(io);         

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
app.use("/api/chat", chatRoutes);
app.use("/api/blocks", blockRoutes);
app.use("/api/calls", callRoutes);



app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Vibe API is running 🚀",
  });
});

server.listen(PORT, () => {
  console.log(`Vibe server running on port ${PORT}`);
});