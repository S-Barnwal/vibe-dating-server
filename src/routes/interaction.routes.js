import express from "express";

import {
  likeProfile,
  passProfile,
  superlikeProfile,
   getSentLikes,
   getReceivedLikes,
} from "../controllers/interaction.controller.js";

import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/like", protect, likeProfile);

router.post("/pass", protect, passProfile);

router.post("/superlike", protect, superlikeProfile);

router.get("/sent-likes", protect, getSentLikes);

router.get(
  "/received-likes",
  protect,
  getReceivedLikes
);

export default router;