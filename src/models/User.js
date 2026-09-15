import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    // Email verification
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationOtp: {
      type: String,
      select: false,
    },

    emailVerificationOtpExpiresAt: {
      type: Date,
      select: false,
    },

    // Profile
    profileCompleted: {
      type: Boolean,
      default: false,
    },

    // Password reset
    passwordResetOtp: {
      type: String,
      select: false,
    },

    passwordResetOtpExpiresAt: {
      type: Date,
      select: false,
    },

    passwordResetVerified: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;