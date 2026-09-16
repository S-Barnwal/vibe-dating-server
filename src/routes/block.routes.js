import express from "express";

import {
  getBlockStatus,
  blockUser,
  unblockUser,
} from "../controllers/block.controller.js";

import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/:userId/status", protect, getBlockStatus);

router.post("/:userId", protect, blockUser);

router.delete("/:userId", protect, unblockUser);

export default router;