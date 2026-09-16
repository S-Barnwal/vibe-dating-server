import express from "express";

import {
  getConversation,
  sendMessage,
  markMessagesAsRead,
  searchMessages,
} from "../controllers/chat.controller.js";

import protect from "../middleware/auth.middleware.js";

const router = express.Router();

/*
 * ==========================================
 * GET CONVERSATION
 * ==========================================
 */

router.get(
  "/:userId",
  protect,
  getConversation
);

/*
 * ==========================================
 * SEARCH MESSAGES
 * ==========================================
 */

router.get(
  "/:userId/search",
  protect,
  searchMessages
);

/*
 * ==========================================
 * SEND MESSAGE
 * ==========================================
 */

router.post(
  "/:userId/messages",
  protect,
  sendMessage
);

/*
 * ==========================================
 * MARK MESSAGES AS READ
 * ==========================================
 */

router.patch(
  "/:userId/read",
  protect,
  markMessagesAsRead
);

export default router;