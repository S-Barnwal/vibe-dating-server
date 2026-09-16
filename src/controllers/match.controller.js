import Match from "../models/Match.js";
import Profile from "../models/Profile.js";

export const getMatches = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    /*
     * Find all matches where the current user
     * is either user1 or user2.
     */
    const matches = await Match.find({
      $or: [
        { user1: userId },
        { user2: userId },
      ],
    })
      .sort({ matchedAt: -1 })
      .lean();

    if (matches.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          matches: [],
          count: 0,
        },
      });
    }

    /*
     * Get the other user's ID from every match.
     */
    const otherUserIds = matches.map((match) => {
      if (
        match.user1.toString() ===
        userId.toString()
      ) {
        return match.user2;
      }

      return match.user1;
    });

    /*
     * Get profiles of matched users.
     */
    const profiles = await Profile.find({
      user: {
        $in: otherUserIds,
      },
    })
      .populate({
        path: "user",
        select:
          "name isEmailVerified profileCompleted",
        match: {
          profileCompleted: true,
        },
      })
      .lean();

    const profileMap = new Map(
      profiles
        .filter((profile) => profile.user)
        .map((profile) => [
          profile.user._id.toString(),
          profile,
        ])
    );

    /*
     * Keep the same order as matches.
     */
    const formattedMatches = matches
      .map((match) => {
        const otherUserId =
          match.user1.toString() ===
          userId.toString()
            ? match.user2
            : match.user1;

        const profile = profileMap.get(
          otherUserId.toString()
        );

        if (!profile) {
          return null;
        }

        const age = profile.dateOfBirth
          ? Math.floor(
              (
                new Date().getTime() -
                new Date(
                  profile.dateOfBirth
                ).getTime()
              ) /
                (365.25 *
                  24 *
                  60 *
                  60 *
                  1000)
            )
          : null;

        return {
          id: match._id.toString(),

          userId:
            profile.user._id.toString(),

          name:
            profile.user.name,

          age,

          gender:
            profile.gender,

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

          isVerified:
            profile.isVerified ||
            profile.user.isEmailVerified ||
            false,

          lastActiveAt:
            profile.lastActiveAt || null,

          matchedAt:
            match.matchedAt,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      data: {
        matches: formattedMatches,
        count: formattedMatches.length,
      },
    });
  } catch (error) {
    console.error(
      "Get matches error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load your matches.",
    });
  }
};