import express from "express";

import {
  getMatches,
} from "../controllers/match.controller.js";

import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
  "/",
  protect,
  getMatches
);

export default router;