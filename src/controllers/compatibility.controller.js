// ============================================================
// VIBE - COMPATIBILITY CONTROLLER
// ============================================================

import Profile from "../models/Profile.js";
import {
  calculateCompatibility,
  sortByCompatibility,
} from "../services/compatibility.service.js";


// ============================================================
// GET MOST COMPATIBLE PROFILES
// ============================================================

export const getMostCompatibleProfiles = async (req, res) => {
  try {
    const myUserId = req.userId;

    // --------------------------------------------------------
    // Get logged-in user's profile
    // --------------------------------------------------------

    const myProfile = await Profile.findOne({
      user: myUserId,
    });

    if (!myProfile) {
      return res.status(404).json({
        success: false,
        message: "Your profile was not found",
      });
    }

    // --------------------------------------------------------
    // Find discoverable profiles
    // --------------------------------------------------------

    const profiles = await Profile.find({
      user: {
        $ne: myUserId,
      },
      isDiscoverable: true,
    })
      .populate({
        path: "user",
        select: "name isEmailVerified profileCompleted",
      })
      .sort({
        lastActiveAt: -1,
      });

    // --------------------------------------------------------
    // Calculate compatibility for every profile
    // --------------------------------------------------------

    const compatibleProfiles = profiles.map(
      (profile) => {
        // ----------------------------------------------
        // Calculate distance
        // ----------------------------------------------

        let distanceKm = null;

        if (
          myProfile.location?.lat != null &&
          myProfile.location?.lng != null &&
          profile.location?.lat != null &&
          profile.location?.lng != null
        ) {
          const lat1 =
            Number(myProfile.location.lat);

          const lng1 =
            Number(myProfile.location.lng);

          const lat2 =
            Number(profile.location.lat);

          const lng2 =
            Number(profile.location.lng);

          const toRadians = (degrees) =>
            (degrees * Math.PI) / 180;

          const earthRadiusKm = 6371;

          const dLat = toRadians(lat2 - lat1);
          const dLng = toRadians(lng2 - lng1);

          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRadians(lat1)) *
              Math.cos(toRadians(lat2)) *
              Math.sin(dLng / 2) ** 2;

          const c =
            2 *
            Math.atan2(
              Math.sqrt(a),
              Math.sqrt(1 - a)
            );

          distanceKm =
            earthRadiusKm * c;
        }

        // ----------------------------------------------
        // Compatibility
        // ----------------------------------------------

        const compatibility =
          calculateCompatibility({
            myProfile,
            targetProfile: profile,
            distanceKm,
          });

        // ----------------------------------------------
        // Public profile response
        // ----------------------------------------------

        return {
          id: profile._id.toString(),

          userId:
            profile.user?._id?.toString() || "",

          name:
            profile.user?.name ||
            "Vibe User",

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

          distance:
            formatDistance(distanceKm),

          compatibility:
            compatibility.score,

          compatibilityReasons:
            compatibility.reasons,

          sharedInterests:
            compatibility.sharedInterests,

          compatibilityBreakdown:
            compatibility.breakdown,
        };
      }
    );

    // --------------------------------------------------------
    // Sort highest compatibility first
    // --------------------------------------------------------

    const sortedProfiles =
      sortByCompatibility(
        compatibleProfiles.map(
          (profile) => ({
            ...profile,
            score:
              profile.compatibility,
          })
        )
      );

    // --------------------------------------------------------
    // Return ALL compatible profiles
    // --------------------------------------------------------
    // Mobile "Most Compatible" screen can decide
    // whether to show 4, 10, or all profiles.
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,

      data: {
        profiles: sortedProfiles,

        count: sortedProfiles.length,
      },
    });

  } catch (error) {
    console.error(
      "Most compatible error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to calculate compatible profiles",
    });
  }
};


// ============================================================
// AGE CALCULATOR
// ============================================================

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) {
    return 0;
  }

  const today = new Date();

  const birthDate =
    new Date(dateOfBirth);

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
      today.getDate() <
        birthDate.getDate()
    )
  ) {
    age--;
  }

  return age;
};


// ============================================================
// DISTANCE FORMATTER
// ============================================================

const formatDistance = (distanceKm) => {
  if (
    distanceKm == null ||
    !Number.isFinite(distanceKm)
  ) {
    return null;
  }

  if (distanceKm < 1) {
    return "< 1 km away";
  }

  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km away`;
  }

  return `${Math.round(distanceKm)} km away`;
};