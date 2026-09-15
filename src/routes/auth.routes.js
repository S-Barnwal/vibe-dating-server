import express from "express";

import {
  signup,
  login,
  getMe,
  changePassword,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  verifyEmailOtp,
  resendEmailOtp,
} from "../controllers/auth.controller.js";

import protect from "../middleware/auth.middleware.js";

const router = express.Router();


// =====================================================
// AUTH
// =====================================================

router.post("/signup", signup);

router.post("/login", login);


// =====================================================
// EMAIL VERIFICATION
// =====================================================

router.post("/verify-email-otp", verifyEmailOtp);

router.post("/resend-email-otp", resendEmailOtp);


// =====================================================
// PROTECTED ROUTES
// =====================================================

router.get("/me", protect, getMe);

router.post(
  "/change-password",
  protect,
  changePassword
);


// =====================================================
// PASSWORD RESET
// =====================================================

router.post(
  "/forgot-password",
  forgotPassword
);

router.post(
  "/verify-reset-otp",
  verifyResetOtp
);

router.post(
  "/reset-password",
  resetPassword
);

export default router;