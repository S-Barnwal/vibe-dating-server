import express from "express";

import {
  startCall,
  acceptCall,
  rejectCall,
  endCall,
} from "../controllers/call.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Voice Call Routes
|--------------------------------------------------------------------------
*/

// Start a new voice call
router.post("/start", authMiddleware, startCall);

// Accept incoming call
router.patch("/:callId/accept", authMiddleware, acceptCall);

// Reject incoming call
router.patch("/:callId/reject", authMiddleware, rejectCall);

// End active call
router.patch("/:callId/end", authMiddleware, endCall);

export default router;