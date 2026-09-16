import express from "express";

import {
  getBlockStatus,
  getBlockedUsers,
  blockUser,
  unblockUser,
} from "../controllers/block.controller.js";

import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
  "/",
  protect,
  getBlockedUsers
);

router.get(
  "/:userId/status",
  protect,
  getBlockStatus
);

router.post(
  "/:userId",
  protect,
  blockUser
);

router.delete(
  "/:userId",
  protect,
  unblockUser
);

export default router;