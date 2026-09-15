import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";

import {
  validateSignup,
  validateLogin,
  validateChangePassword,
  validateForgotPassword,
  validateVerifyResetOtp,
  validateResetPassword,
  validateVerifyEmailOtp,
} from "../validators/auth.validator.js";

import {
  sendPasswordResetOtp,
  sendEmailVerificationOtp,
} from "../services/email.service.js";


// =====================================================
// SIGNUP
// =====================================================

export const signup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
    } = req.body;

    const errors = validateSignup({
      name,
      email,
      password,
      confirmPassword,
    });

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please fix the validation errors",
        errors,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    // Generate 6-digit email verification OTP
    const emailVerificationOtp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const emailVerificationOtpExpiresAt =
      new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,

      isEmailVerified: false,

      emailVerificationOtp,
      emailVerificationOtpExpiresAt,
    });

    // Send verification OTP to user's email
    try {
      await sendEmailVerificationOtp({
        email: normalizedEmail,
        otp: emailVerificationOtp,
      });
    } catch (emailError) {
      console.error(
        "Signup verification email error:",
        emailError
      );

      // Remove account if verification email could not be sent
      await User.findByIdAndDelete(user._id);

      return res.status(500).json({
        success: false,
        message:
          "Unable to send verification email. Please try again",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
      },
      process.env.JWT_SECRET,
      {
        expiresIn:
          process.env.JWT_EXPIRES_IN || "7d",
      }
    );

    return res.status(201).json({
      success: true,
      message:
        "Account created successfully. Please verify your email",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          profileCompleted: user.profileCompleted,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating your account",
    });
  }
};


// =====================================================
// VERIFY EMAIL OTP
// =====================================================

export const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const errors = validateVerifyEmailOtp({
      email,
      otp,
    });

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please fix the validation errors",
        errors,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select(
      "+emailVerificationOtp +emailVerificationOtpExpiresAt"
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification request",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    if (
      !user.emailVerificationOtp ||
      !user.emailVerificationOtpExpiresAt
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Verification code not found. Please request a new code",
      });
    }

    if (
      user.emailVerificationOtpExpiresAt.getTime() <
      Date.now()
    ) {
      user.emailVerificationOtp = undefined;
      user.emailVerificationOtpExpiresAt = undefined;

      await user.save();

      return res.status(400).json({
        success: false,
        message:
          "Verification code has expired. Please request a new code",
      });
    }

    if (user.emailVerificationOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;

    // Clear OTP after successful verification
    user.emailVerificationOtp = undefined;
    user.emailVerificationOtpExpiresAt = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          profileCompleted: user.profileCompleted,
        },
      },
    });
  } catch (error) {
    console.error(
      "Verify email OTP error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while verifying your email",
    });
  }
};


// =====================================================
// RESEND EMAIL VERIFICATION OTP
// =====================================================

export const resendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const errors = validateVerifyEmailOtp({
      email,
      otp: "000000",
    });

    // Only use email validation here
    delete errors.otp;

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please fix the validation errors",
        errors,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select(
      "+emailVerificationOtp +emailVerificationOtpExpiresAt"
    );

    /*
     * Don't reveal whether an account exists.
     */
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a verification code has been sent",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const otpExpiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    user.emailVerificationOtp = otp;
    user.emailVerificationOtpExpiresAt = otpExpiresAt;

    await user.save();

    try {
      await sendEmailVerificationOtp({
        email: normalizedEmail,
        otp,
      });
    } catch (emailError) {
      console.error(
        "Resend email OTP error:",
        emailError
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to send verification email. Please try again",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a verification code has been sent",
    });
  } catch (error) {
    console.error(
      "Resend email OTP error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while resending the verification code",
    });
  }
};


// =====================================================
// LOGIN
// =====================================================

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const errors = validateLogin({
      email,
      password,
    });

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please fix the validation errors",
        errors,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // =================================================
    // EMAIL VERIFICATION CHECK
    // =================================================

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Please verify your email before logging in",
        code: "EMAIL_NOT_VERIFIED",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            profileCompleted: user.profileCompleted,
          },
        },
      });
    }

    // =================================================
    // CREATE JWT
    // =================================================

    const token = jwt.sign(
      {
        userId: user._id.toString(),
      },
      process.env.JWT_SECRET,
      {
        expiresIn:
          process.env.JWT_EXPIRES_IN || "7d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          profileCompleted: user.profileCompleted,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while logging in",
    });
  }
};

// =====================================================
// GET CURRENT USER
// =====================================================

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          profileCompleted: user.profileCompleted,
        },
      },
    });
  } catch (error) {
    console.error(
      "Get me error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching your profile",
    });
  }
};


// =====================================================
// CHANGE PASSWORD
// =====================================================

export const changePassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    const errors = validateChangePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please fix the validation errors",
        errors,
      });
    }

    const user = await User.findById(req.userId)
      .select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isCurrentPasswordCorrect =
      await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (!isCurrentPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashedPassword =
      await bcrypt.hash(newPassword, 12);

    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password changed successfully",
    });
  } catch (error) {
    console.error(
      "Change password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while changing your password",
    });
  }
};


// =====================================================
// FORGOT PASSWORD
// =====================================================

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const errors = validateForgotPassword({
      email,
    });

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Please fix the validation errors",
        errors,
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select(
      "+passwordResetOtp +passwordResetOtpExpiresAt"
    );

    /*
     * Don't reveal whether the email exists.
     */
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a reset code has been sent",
      });
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const otpExpiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    user.passwordResetOtp = otp;
    user.passwordResetOtpExpiresAt =
      otpExpiresAt;
    user.passwordResetVerified = false;

    await user.save();

    await sendPasswordResetOtp({
      email: normalizedEmail,
      otp,
    });

    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a reset code has been sent",
    });
  } catch (error) {
    console.error(
      "Forgot password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while processing your request",
    });
  }
};


// =====================================================
// VERIFY PASSWORD RESET OTP
// =====================================================

export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const errors = validateVerifyResetOtp({
      email,
      otp,
    });

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Please fix the validation errors",
        errors,
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select(
      "+passwordResetOtp +passwordResetOtpExpiresAt"
    );

    if (!user || !user.passwordResetOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    if (
      !user.passwordResetOtpExpiresAt ||
      user.passwordResetOtpExpiresAt.getTime() <
        Date.now()
    ) {
      user.passwordResetOtp = undefined;
      user.passwordResetOtpExpiresAt =
        undefined;
      user.passwordResetVerified = false;

      await user.save();

      return res.status(400).json({
        success: false,
        message:
          "OTP has expired. Please request a new code",
      });
    }

    if (user.passwordResetOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    user.passwordResetVerified = true;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "OTP verified successfully",
    });
  } catch (error) {
    console.error(
      "Verify reset OTP error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while verifying the OTP",
    });
  }
};


// =====================================================
// RESET PASSWORD
// =====================================================

export const resetPassword = async (req, res) => {
  try {
    const {
      email,
      newPassword,
      confirmPassword,
    } = req.body;

    const errors = validateResetPassword({
      email,
      newPassword,
      confirmPassword,
    });

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Please fix the validation errors",
        errors,
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select(
      "+password +passwordResetVerified"
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Unable to reset password",
      });
    }

    if (!user.passwordResetVerified) {
      return res.status(400).json({
        success: false,
        message:
          "Please verify the reset OTP first",
      });
    }

    const hashedPassword =
      await bcrypt.hash(newPassword, 12);

    user.password = hashedPassword;

    // Invalidate reset flow
    user.passwordResetOtp = undefined;
    user.passwordResetOtpExpiresAt =
      undefined;
    user.passwordResetVerified = false;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. Please login again",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while resetting your password",
    });
  }
};