import mongoose from "mongoose";

const promptSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    answer: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
  },
  {
    _id: false,
  }
);

const locationSchema = new mongoose.Schema(
  {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },

    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
  },
  {
    _id: false,
  }
);

const profileSchema = new mongoose.Schema(
  {
    // =====================================================
    // USER
    // =====================================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // =====================================================
    // BASIC INFORMATION
    // =====================================================

    dateOfBirth: {
      type: Date,
      required: true,
    },

    gender: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },

    interestedIn: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },

    // =====================================================
    // PROFILE CONTENT
    // =====================================================

    bio: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    // =====================================================
    // INTERESTS
    // =====================================================

    interests: {
      type: [String],
      required: true,
      validate: {
        validator: (value) =>
          Array.isArray(value) &&
          value.length >= 3 &&
          value.length <= 8,
        message: "Profile must have between 3 and 8 interests",
      },
    },

    // =====================================================
    // PHOTOS
    // =====================================================

    photos: {
      type: [String],
      required: true,
      validate: {
        validator: (value) =>
          Array.isArray(value) &&
          value.length >= 2 &&
          value.length <= 6,
        message: "Profile must have between 2 and 6 photos",
      },
    },

    // =====================================================
    // DATING INTENTION
    // =====================================================

    datingIntention: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    // =====================================================
    // PROFILE PROMPTS
    // =====================================================

    prompts: {
      type: [promptSchema],
      default: [],
      validate: {
        validator: (value) => value.length <= 3,
        message: "You can have up to 3 profile prompts",
      },
    },

    // =====================================================
    // LOCATION
    // =====================================================
    // Exact coordinates stay private.
    // They are used only for distance/nearby calculations.
    // Never return these directly to other users.
    // =====================================================

    location: {
      type: locationSchema,
      default: null,
    },

    // =====================================================
    // VERIFICATION
    // =====================================================

    isVerified: {
      type: Boolean,
      default: false,
    },

    // =====================================================
    // ACTIVITY
    // =====================================================

    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // =====================================================
    // PROFILE VISIBILITY
    // =====================================================

    isDiscoverable: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// =========================================================
// INDEX FOR NEARBY / LOCATION QUERIES
// =========================================================
//
// We are intentionally NOT using a normal 2dsphere index
// yet because location is stored as { latitude, longitude }
// for privacy/control. Distance calculation will be handled
// by the backend without exposing exact coordinates.
//
// =========================================================

// Helpful index for discovery queries.
profileSchema.index({
  gender: 1,
  interestedIn: 1,
  isDiscoverable: 1,
});

profileSchema.index({
  datingIntention: 1,
  isDiscoverable: 1,
});

const Profile = mongoose.model("Profile", profileSchema);

export default Profile;