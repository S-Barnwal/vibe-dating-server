import express from "express";

import {
  completeProfile,
  getMyProfile,
  updateProfile,
  updateLastActive,
  getDiscoverProfiles,
} from "../controllers/profile.controller.js";

import protect from "../middleware/auth.middleware.js";

const router = express.Router();

// ============================================================
// PROFILE ONBOARDING
// ============================================================

// Complete profile for the first time
router.post(
  "/complete",
  protect,
  completeProfile
);

// ============================================================
// MY PROFILE
// ============================================================

// Get logged-in user's complete profile
router.get(
  "/me",
  protect,
  getMyProfile
);

// ============================================================
// UPDATE PROFILE
// ============================================================

// Update editable profile information
router.put(
  "/update",
  protect,
  updateProfile
);

// ============================================================
// ACTIVITY
// ============================================================

// Update last active time
router.patch(
  "/activity",
  protect,
  updateLastActive
);

// ============================================================
// DISCOVER
// ============================================================

// Get profiles for Discover screen
router.get(
  "/discover",
  protect,
  getDiscoverProfiles
);

export default router;