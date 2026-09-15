import express from "express";

import {
  likeProfile,
  passProfile,
  superlikeProfile,
} from "../controllers/interaction.controller.js";

import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/like", protect, likeProfile);

router.post("/pass", protect, passProfile);

router.post("/superlike", protect, superlikeProfile);

export default router;