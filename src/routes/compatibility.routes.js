import express from "express";

import {
  getMostCompatibleProfiles,
} from "../controllers/compatibility.controller.js";

import protect from "../middleware/auth.middleware.js";

const router = express.Router();

// ============================================================
// MOST COMPATIBLE
// ============================================================

router.get(
  "/most-compatible",
  protect,
  getMostCompatibleProfiles
);

export default router;