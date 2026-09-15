import Profile from "../models/Profile.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// ============================================================
// HELPERS
// ============================================================

const parseBirthday = (birthday) => {
  if (!birthday || typeof birthday !== "string") {
    return null;
  }

  const cleaned = birthday.replace(/\s/g, "");
  const parts = cleaned.split("/");

  if (parts.length !== 3) {
    return null;
  }

  const [day, month, year] = parts.map(Number);

  if (
    !day ||
    !month ||
    !year ||
    day < 1 ||
    day > 31 ||
    month < 1 ||
    month > 12 ||
    year < 1900
  ) {
    return null;
  }

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
};

const calculateAge = (dateOfBirth) => {
  const today = new Date();

  let age =
    today.getFullYear() -
    dateOfBirth.getUTCFullYear();

  const monthDifference =
    today.getMonth() -
    dateOfBirth.getUTCMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < dateOfBirth.getUTCDate())
  ) {
    age--;
  }

  return age;
};

// ============================================================
// CLEAN INTERESTS
// ============================================================

const cleanInterests = (interests) => {
  if (!Array.isArray(interests)) {
    return [];
  }

  return [
    ...new Set(
      interests
        .filter(
          (interest) =>
            typeof interest === "string"
        )
        .map((interest) => interest.trim())
        .filter(Boolean)
    ),
  ];
};

// ============================================================
// CLEAN PHOTOS
// ============================================================

const cleanPhotos = (photos) => {
  if (!Array.isArray(photos)) {
    return [];
  }

  return [
    ...new Set(
      photos
        .filter(
          (photo) =>
            typeof photo === "string"
        )
        .map((photo) => photo.trim())
        .filter(Boolean)
    ),
  ];
};

// ============================================================
// CLEAN PROMPTS
// ============================================================

const cleanPrompts = (prompts) => {
  if (!Array.isArray(prompts)) {
    return [];
  }

  return prompts
    .filter(
      (prompt) =>
        prompt &&
        typeof prompt === "object"
    )
    .map((prompt) => ({
      question:
        typeof prompt.question === "string"
          ? prompt.question.trim()
          : "",

      answer:
        typeof prompt.answer === "string"
          ? prompt.answer.trim()
          : "",
    }))
    .filter(
      (prompt) =>
        prompt.question &&
        prompt.answer
    )
    .slice(0, 3);
};

// ============================================================
// NORMALIZE LOCATION
// ============================================================

const normalizeLocation = (location) => {
  if (!location || typeof location !== "object") {
    return null;
  }

  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  if (
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
};

// ============================================================
// DISTANCE CALCULATION
// ============================================================
//
// Returns distance in kilometers.
//
// IMPORTANT:
// Exact coordinates are NEVER returned to other users.
// This helper is only used internally by the backend.
//
// ============================================================

const calculateDistanceKm = (
  latitude1,
  longitude1,
  latitude2,
  longitude2
) => {
  const earthRadiusKm = 6371;

  const toRadians = (value) =>
    (value * Math.PI) / 180;

  const dLatitude = toRadians(
    latitude2 - latitude1
  );

  const dLongitude = toRadians(
    longitude2 - longitude1
  );

  const a =
    Math.sin(dLatitude / 2) ** 2 +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(dLongitude / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadiusKm * c;
};

// ============================================================
// FORMAT DISTANCE
// ============================================================

const formatDistance = (distanceKm) => {
  if (!Number.isFinite(distanceKm)) {
    return null;
  }

  if (distanceKm < 1) {
    return "Less than 1 km away";
  }

  return `${Math.round(distanceKm)} km away`;
};

// ============================================================
// FORMAT PUBLIC PROFILE
// ============================================================
//
// This controls exactly what other users are allowed to see.
//
// Notice:
// - latitude is NOT returned
// - longitude is NOT returned
//
// ============================================================

const formatPublicProfile = (
  profile,
  distanceKm = null
) => {
  const age = calculateAge(
    profile.dateOfBirth
  );

  return {
    id: profile._id,
    userId: profile.user?._id || profile.user,

    name: profile.user?.name || null,

    age,

    gender: profile.gender,

    interestedIn: profile.interestedIn,

    bio: profile.bio,

    description: profile.description,

    interests: profile.interests,

    photos: profile.photos,

    primaryPhoto:
      profile.photos?.[0] || null,

    datingIntention:
      profile.datingIntention,

    prompts: profile.prompts || [],

    isVerified:
      profile.isVerified,

    lastActiveAt:
      profile.lastActiveAt,

    isDiscoverable:
      profile.isDiscoverable,

    distance:
      distanceKm !== null
        ? formatDistance(distanceKm)
        : null,
  };
};

// ============================================================
// COMPLETE PROFILE
// ============================================================

export const completeProfile = async (
  req,
  res
) => {
  try {
    const userId = req.userId;

    const {
      birthday,
      gender,
      interestedIn,
      interests,
      photos,

      bio,
      description,
      datingIntention,
      prompts,

      location,
    } = req.body;

    // ========================================================
    // REQUIRED BASIC FIELDS
    // ========================================================

    if (!birthday) {
      return res.status(400).json({
        success: false,
        message: "Birthday is required",
      });
    }

    if (!gender) {
      return res.status(400).json({
        success: false,
        message: "Gender is required",
      });
    }

    if (!interestedIn) {
      return res.status(400).json({
        success: false,
        message: "Interested in is required",
      });
    }

    // ========================================================
    // INTERESTS
    // ========================================================

    const cleanInterestList =
      cleanInterests(interests);

    if (
      cleanInterestList.length < 3 ||
      cleanInterestList.length > 8
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please select between 3 and 8 interests",
      });
    }

    // ========================================================
    // PHOTOS
    // ========================================================

    const cleanPhotoList =
      cleanPhotos(photos);

    if (
      cleanPhotoList.length < 2 ||
      cleanPhotoList.length > 6
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide between 2 and 6 valid photos",
      });
    }

    // ========================================================
    // BIRTHDAY / AGE
    // ========================================================

    const dateOfBirth =
      parseBirthday(birthday);

    if (!dateOfBirth) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid birthday",
      });
    }

    const age =
      calculateAge(dateOfBirth);

    if (age < 18) {
      return res.status(400).json({
        success: false,
        message:
          "You must be at least 18 years old",
      });
    }

    if (age > 100) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid birthday",
      });
    }

    // ========================================================
    // USER
    // ========================================================

    const user =
      await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ========================================================
    // BIO
    // ========================================================

    const cleanBio =
      typeof bio === "string"
        ? bio.trim()
        : "";

    if (!cleanBio) {
      return res.status(400).json({
        success: false,
        message: "Bio is required",
      });
    }

    if (cleanBio.length > 180) {
      return res.status(400).json({
        success: false,
        message:
          "Bio cannot be longer than 180 characters",
      });
    }

    // ========================================================
    // DESCRIPTION
    // ========================================================

    const cleanDescription =
      typeof description === "string"
        ? description.trim()
        : "";

    if (cleanDescription.length > 500) {
      return res.status(400).json({
        success: false,
        message:
          "Description cannot be longer than 500 characters",
      });
    }

    // ========================================================
    // DATING INTENTION
    // ========================================================

    const cleanDatingIntention =
      typeof datingIntention === "string"
        ? datingIntention.trim()
        : "";

    if (!cleanDatingIntention) {
      return res.status(400).json({
        success: false,
        message:
          "Dating intention is required",
      });
    }

    // ========================================================
    // PROMPTS
    // ========================================================

    const cleanPromptList =
      cleanPrompts(prompts);

    // ========================================================
    // LOCATION
    // ========================================================

    const cleanLocation =
      normalizeLocation(location);

    // Location is optional for now.
    // If provided, it must be valid.

    if (location && !cleanLocation) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid location",
      });
    }

    // ========================================================
    // UPDATE / CREATE PROFILE
    // ========================================================

    const profile =
      await Profile.findOneAndUpdate(
        {
          user: userId,
        },
        {
          user: userId,

          dateOfBirth,

          gender: gender.trim(),

          interestedIn:
            interestedIn.trim(),

          interests:
            cleanInterestList,

          photos:
            cleanPhotoList,

          bio:
            cleanBio,

          description:
            cleanDescription,

          datingIntention:
            cleanDatingIntention,

          prompts:
            cleanPromptList,

          location:
            cleanLocation,

          lastActiveAt:
            new Date(),

          isDiscoverable:
            true,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      ).populate({
        path: "user",
        select:
          "name email isEmailVerified profileCompleted",
      });

    // ========================================================
    // MARK USER PROFILE AS COMPLETED
    // ========================================================

    user.profileCompleted = true;

    await user.save();

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,
      message:
        "Profile completed successfully",

      data: {
        profile:
          formatPublicProfile(profile),

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isEmailVerified:
            user.isEmailVerified,
          profileCompleted:
            user.profileCompleted,
        },
      },
    });
  } catch (error) {
    console.error(
      "Complete profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to complete profile",
    });
  }
};

// ============================================================
// GET MY PROFILE
// ============================================================

export const getMyProfile = async (
  req,
  res
) => {
  try {
    const profile =
      await Profile.findOne({
        user: req.userId,
      }).populate({
        path: "user",
        select:
          "name email isEmailVerified profileCompleted",
      });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const age =
      calculateAge(profile.dateOfBirth);

    return res.status(200).json({
      success: true,

      data: {
        profile: {
          id: profile._id,

          user:
            profile.user?._id ||
            profile.user,

          name:
            profile.user?.name || null,

          email:
            profile.user?.email || null,

          dateOfBirth:
            profile.dateOfBirth,

          age,

          gender:
            profile.gender,

          interestedIn:
            profile.interestedIn,

          interests:
            profile.interests,

          photos:
            profile.photos,

          primaryPhoto:
            profile.photos?.[0] || null,

          bio:
            profile.bio,

          description:
            profile.description,

          datingIntention:
            profile.datingIntention,

          prompts:
            profile.prompts || [],

          // Location is returned only
          // to the profile owner.
          location:
            profile.location || null,

          isVerified:
            profile.isVerified,

          lastActiveAt:
            profile.lastActiveAt,

          isDiscoverable:
            profile.isDiscoverable,
        },

        user: {
          id:
            profile.user?._id,

          name:
            profile.user?.name,

          email:
            profile.user?.email,

          isEmailVerified:
            profile.user?.isEmailVerified,

          profileCompleted:
            profile.user?.profileCompleted,
        },
      },
    });
  } catch (error) {
    console.error(
      "Get profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get profile",
    });
  }
};

// ============================================================
// UPDATE PROFILE
// ============================================================

export const updateProfile = async (
  req,
  res
) => {
  try {
    const userId = req.userId;

    const profile =
      await Profile.findOne({
        user: userId,
      });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const {
      name,
      bio,
      description,
      interests,
      datingIntention,
      prompts,
      photos,
      location,
      isDiscoverable,
    } = req.body;

    // ========================================================
    // NAME
    // ========================================================

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Name is required",
        });
      }

      const cleanName = name.trim();

      if (
        cleanName.length < 2 ||
        cleanName.length > 50
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name must be between 2 and 50 characters",
        });
      }

      await User.findByIdAndUpdate(
        userId,
        {
          name: cleanName,
        }
      );
    }

    // ========================================================
    // BIO
    // ========================================================

    if (bio !== undefined) {
      if (
        typeof bio !== "string" ||
        !bio.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Bio is required",
        });
      }

      const cleanBio = bio.trim();

      if (cleanBio.length > 180) {
        return res.status(400).json({
          success: false,
          message:
            "Bio cannot be longer than 180 characters",
        });
      }

      profile.bio = cleanBio;
    }

    // ========================================================
    // DESCRIPTION
    // ========================================================

    if (description !== undefined) {
      if (
        typeof description !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Description must be text",
        });
      }

      const cleanDescription =
        description.trim();

      if (cleanDescription.length > 500) {
        return res.status(400).json({
          success: false,
          message:
            "Description cannot be longer than 500 characters",
        });
      }

      profile.description =
        cleanDescription;
    }

    // ========================================================
    // INTERESTS
    // ========================================================

    if (interests !== undefined) {
      const cleanInterestList =
        cleanInterests(interests);

      if (
        cleanInterestList.length < 3 ||
        cleanInterestList.length > 8
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please select between 3 and 8 interests",
        });
      }

      profile.interests =
        cleanInterestList;
    }

    // ========================================================
    // DATING INTENTION
    // ========================================================

    if (
      datingIntention !== undefined
    ) {
      if (
        typeof datingIntention !==
          "string" ||
        !datingIntention.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Dating intention is required",
        });
      }

      profile.datingIntention =
        datingIntention.trim();
    }

    // ========================================================
    // PROMPTS
    // ========================================================

    if (prompts !== undefined) {
      const cleanPromptList =
        cleanPrompts(prompts);

      if (cleanPromptList.length > 3) {
        return res.status(400).json({
          success: false,
          message:
            "You can have up to 3 prompts",
        });
      }

      profile.prompts =
        cleanPromptList;
    }

    // ========================================================
    // PHOTOS
    // ========================================================

    if (photos !== undefined) {
      const cleanPhotoList =
        cleanPhotos(photos);

      if (
        cleanPhotoList.length < 2 ||
        cleanPhotoList.length > 6
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide between 2 and 6 photos",
        });
      }

      profile.photos =
        cleanPhotoList;
    }

    // ========================================================
    // LOCATION
    // ========================================================

    if (location !== undefined) {
      const cleanLocation =
        normalizeLocation(location);

      if (
        location !== null &&
        !cleanLocation
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide a valid location",
        });
      }

      profile.location =
        cleanLocation;
    }

    // ========================================================
    // DISCOVERABILITY
    // ========================================================

    if (
      isDiscoverable !== undefined
    ) {
      if (
        typeof isDiscoverable !==
        "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "isDiscoverable must be true or false",
        });
      }

      profile.isDiscoverable =
        isDiscoverable;
    }

    // ========================================================
    // ACTIVITY
    // ========================================================

    profile.lastActiveAt =
      new Date();

    await profile.save();

    const updatedUser =
      await User.findById(userId).select(
        "name email isEmailVerified profileCompleted"
      );

    const updatedProfile =
      await Profile.findOne({
        user: userId,
      }).populate({
        path: "user",
        select:
          "name email isEmailVerified profileCompleted",
      });

    return res.status(200).json({
      success: true,
      message:
        "Profile updated successfully",

      data: {
        profile:
          formatPublicProfile(
            updatedProfile
          ),

        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          isEmailVerified:
            updatedUser.isEmailVerified,
          profileCompleted:
            updatedUser.profileCompleted,
        },
      },
    });
  } catch (error) {
    console.error(
      "Update profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update profile",
    });
  }
};

// ============================================================
// UPDATE LAST ACTIVE
// ============================================================

export const updateLastActive = async (
  req,
  res
) => {
  try {
    const profile =
      await Profile.findOneAndUpdate(
        {
          user: req.userId,
        },
        {
          lastActiveAt: new Date(),
        },
        {
          new: true,
        }
      );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Activity updated",
      data: {
        lastActiveAt:
          profile.lastActiveAt,
      },
    });
  } catch (error) {
    console.error(
      "Update activity error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update activity",
    });
  }
};

// ============================================================
// DISCOVER PROFILES
// ============================================================
export const getDiscoverProfiles = async (req, res) => {
  try {
    const userId =
      req.user?._id ||
      req.user?.id ||
      req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const viewerProfile = await Profile.findOne({
      user: userId,
    });

    if (!viewerProfile) {
      return res.status(404).json({
        success: false,
        message: "Complete your profile first.",
      });
    }

    const genderPreference =
      viewerProfile.interestedIn?.trim() || "";

    /*
     * Normalize dating preferences.
     *
     * Frontend:
     * Men / Women / Everyone
     *
     * Database:
     * Man / Woman
     */
    const normalizedPreference =
      genderPreference.toLowerCase();

    const query = {
      user: { $ne: userId },
      isDiscoverable: true,
    };

    if (
      normalizedPreference === "men" ||
      normalizedPreference === "man"
    ) {
      query.gender = /^man$/i;
    } else if (
      normalizedPreference === "women" ||
      normalizedPreference === "woman"
    ) {
      query.gender = /^woman$/i;
    }

    /*
     * Everyone = no gender filter.
     */

    const profiles = await Profile.find(query)
      .populate("user", "name")
      .sort({
        lastActiveAt: -1,
        createdAt: -1,
      })
      .limit(50)
      .lean();

    const calculateAge = (dateOfBirth) => {
      const today = new Date();
      const dob = new Date(dateOfBirth);

      let age =
        today.getFullYear() -
        dob.getFullYear();

      const monthDifference =
        today.getMonth() -
        dob.getMonth();

      if (
        monthDifference < 0 ||
        (
          monthDifference === 0 &&
          today.getDate() < dob.getDate()
        )
      ) {
        age -= 1;
      }

      return age;
    };

    const calculateDistanceKm = (
      latitude1,
      longitude1,
      latitude2,
      longitude2
    ) => {
      const earthRadiusKm = 6371;

      const toRadians = (degrees) =>
        (degrees * Math.PI) / 180;

      const deltaLatitude = toRadians(
        latitude2 - latitude1
      );

      const deltaLongitude = toRadians(
        longitude2 - longitude1
      );

      const a =
        Math.sin(deltaLatitude / 2) ** 2 +
        Math.cos(toRadians(latitude1)) *
          Math.cos(toRadians(latitude2)) *
          Math.sin(deltaLongitude / 2) ** 2;

      return (
        earthRadiusKm *
        2 *
        Math.atan2(
          Math.sqrt(a),
          Math.sqrt(1 - a)
        )
      );
    };

    const formatDistance = (distanceKm) => {
      if (!Number.isFinite(distanceKm)) {
        return null;
      }

      if (distanceKm < 1) {
        return "Less than 1 km away";
      }

      if (distanceKm < 10) {
        return `${distanceKm.toFixed(1)} km away`;
      }

      return `${Math.round(distanceKm)} km away`;
    };

    const publicProfiles = profiles.map(
      (profile) => {
        let distance = null;

        if (
          viewerProfile.location &&
          profile.location
        ) {
          const distanceKm =
            calculateDistanceKm(
              viewerProfile.location.latitude,
              viewerProfile.location.longitude,
              profile.location.latitude,
              profile.location.longitude
            );

          distance =
            formatDistance(distanceKm);
        }

        return {
          id: profile._id.toString(),

          user:
            profile.user?._id?.toString() ||
            profile.user?.toString(),

          name:
            profile.user?.name ||
            "Vibe user",

          age: calculateAge(
            profile.dateOfBirth
          ),

          gender:
            profile.gender,

          interestedIn:
            profile.interestedIn,

          bio:
            profile.bio,

          description:
            profile.description || "",

          interests:
            profile.interests || [],

          photos:
            profile.photos || [],

          primaryPhoto:
            profile.photos?.[0] || null,

          datingIntention:
            profile.datingIntention,

          prompts:
            profile.prompts || [],

          distance,

          isVerified:
            profile.isVerified,

          lastActiveAt:
            profile.lastActiveAt,

          createdAt:
            profile.createdAt,

          updatedAt:
            profile.updatedAt,
        };
      }
    );

    /*
     * Logged-in user's discovery data.
     *
     * Exact location is NEVER exposed here.
     */
    const myProfile = {
      id:
        viewerProfile._id.toString(),

      interests:
        viewerProfile.interests || [],

      datingIntention:
        viewerProfile.datingIntention || "",

      gender:
        viewerProfile.gender || "",

      interestedIn:
        viewerProfile.interestedIn || "",
    };

    console.log(
      `Discover: ${publicProfiles.length} profiles found for user ${userId}`
    );

    return res.status(200).json({
      success: true,

      data: {
        profiles: publicProfiles,

        count:
          publicProfiles.length,

        myProfile,
      },
    });
  } catch (error) {
    console.error(
      "Discover profiles error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load discovery profiles.",
    });
  }
};



// ============================================================
// GET PUBLIC PROFILE BY ID
// ============================================================

export const getPublicProfileById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Profile ID is required",
      });
    }

    const profile = await Profile.findById(id).populate({
      path: "user",
      select: "name isEmailVerified profileCompleted",
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    if (!profile.isDiscoverable) {
      return res.status(404).json({
        success: false,
        message: "Profile not available",
      });
    }

    const calculateAge = (dateOfBirth) => {
      if (!dateOfBirth) {
        return 0;
      }

      const today = new Date();
      const birthDate = new Date(dateOfBirth);

      let age =
        today.getFullYear() -
        birthDate.getFullYear();

      const monthDifference =
        today.getMonth() -
        birthDate.getMonth();

      if (
        monthDifference < 0 ||
        (
          monthDifference === 0 &&
          today.getDate() < birthDate.getDate()
        )
      ) {
        age--;
      }

      return age;
    };

    return res.status(200).json({
      success: true,
      data: {
        profile: {
          id: profile._id.toString(),

          user:
            profile.user?._id?.toString() || "",

          name:
            profile.user?.name || "Vibe User",

          age: calculateAge(
            profile.dateOfBirth
          ),

          gender: profile.gender,

          interestedIn:
            profile.interestedIn,

          bio:
            profile.bio || "",

          description:
            profile.description || "",

          interests:
            profile.interests || [],

          photos:
            profile.photos || [],

          primaryPhoto:
            profile.photos?.[0] || null,

          datingIntention:
            profile.datingIntention || "",

          prompts:
            profile.prompts || [],

          isVerified:
            profile.isVerified || false,

          lastActiveAt:
            profile.lastActiveAt,

          createdAt:
            profile.createdAt,

          updatedAt:
            profile.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error(
      "Get public profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load profile",
    });
  }
};