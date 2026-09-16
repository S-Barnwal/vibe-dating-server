import express from "express";

import {
  getConversation,
  sendMessage,
  markMessagesAsRead,
} from "../controllers/chat.controller.js";

import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
  "/:userId",
  protect,
  getConversation
);

router.post(
  "/:userId/messages",
  protect,
  sendMessage
);

router.patch(
  "/:userId/read",
  protect,
  markMessagesAsRead
);

export default router;