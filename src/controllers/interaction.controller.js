import Interaction from "../models/interaction.model.js";
import Profile from "../models/Profile.js";
import Match from "../models/Match.js";

const createInteraction = async (req, res) => {
  try {
    const fromUserId = req.userId;
    const { toUserId } = req.body;

    if (!fromUserId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found",
      });
    }

    if (!toUserId) {
      return res.status(400).json({
        success: false,
        message: "Target profile is required",
      });
    }

    /*
     * Discover frontend currently sends profile.id.
     * To keep the API flexible, first try Profile._id,
     * then try Profile.user.
     */
    let targetProfile = null;

    // First: treat toUserId as Profile ID
    if (toUserId.match(/^[0-9a-fA-F]{24}$/)) {
      targetProfile = await Profile.findById(toUserId);
    }

    // Second: treat toUserId as User ID
    if (!targetProfile) {
      targetProfile = await Profile.findOne({
        user: toUserId,
      });
    }

    if (!targetProfile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    /*
     * Interaction collection should always store User IDs,
     * not Profile IDs.
     */
    const targetUserId = targetProfile.user;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "Target user is not linked to this profile",
      });
    }

    // Prevent interacting with yourself
    if (
      fromUserId.toString() ===
      targetUserId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot interact with yourself",
      });
    }

    /*
     * Save or update the current interaction.
     */
    const interaction =
      await Interaction.findOneAndUpdate(
        {
          fromUser: fromUserId,
          toUser: targetUserId,
        },
        {
          fromUser: fromUserId,
          toUser: targetUserId,
          type: req.interactionType,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

    /*
     * Match is only possible for Like or Super Like.
     *
     * Example:
     *
     * User A → Like → User B
     * User B → Like → User A
     *
     * OR
     *
     * User A → Super Like → User B
     * User B → Like → User A
     */
    let match = null;

    if (
      req.interactionType === "like" ||
      req.interactionType === "superlike"
    ) {
      /*
       * Check whether the other user has already
       * liked or superliked the current user.
       */
      const reverseInteraction =
        await Interaction.findOne({
          fromUser: targetUserId,
          toUser: fromUserId,
          type: {
            $in: ["like", "superlike"],
          },
        });

      if (reverseInteraction) {
        /*
         * Always store the two users in the same order.
         * This prevents duplicate matches such as:
         *
         * A + B
         * B + A
         */
        const [user1, user2] = [
          fromUserId,
          targetUserId,
        ].sort((a, b) =>
          a.toString().localeCompare(
            b.toString()
          )
        );

        /*
         * Create the match if it does not exist.
         * If it already exists, return the existing one.
         */
        match = await Match.findOneAndUpdate(
          {
            user1,
            user2,
          },
          {
            user1,
            user2,
            matchedAt: new Date(),
          },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
          }
        );
      }
    }

    /*
     * Response message.
     */
    const message = match
      ? "It's a match! 💜"
      : req.interactionType === "like"
      ? "Profile liked"
      : req.interactionType === "pass"
      ? "Profile passed"
      : "Super like sent";

    return res.status(200).json({
      success: true,
      message,
      data: {
        interaction: {
          id: interaction._id.toString(),
          toUser: targetUserId.toString(),
          type: interaction.type,
          createdAt: interaction.createdAt,
          updatedAt: interaction.updatedAt,
        },

        /*
         * If a mutual like exists, return match details.
         * Otherwise match will be null.
         */
        match: match
          ? {
              id: match._id.toString(),
              user1: match.user1.toString(),
              user2: match.user2.toString(),
              matchedAt: match.matchedAt,
            }
          : null,
      },
    });
  } catch (error) {
    console.error(
      "Interaction error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to save interaction",
    });
  }
};

export const likeProfile = async (req, res) => {
  req.interactionType = "like";

  return createInteraction(req, res);
};

export const passProfile = async (req, res) => {
  req.interactionType = "pass";

  return createInteraction(req, res);
};

export const superlikeProfile = async (req, res) => {
  req.interactionType = "superlike";

  return createInteraction(req, res);
};

/*
 * Get profiles of people who liked the
 * currently logged-in user.
 */
export const getReceivedLikes = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    /*
     * Find all active "like" interactions where
     * the current user is the receiver.
     */
    const receivedLikes = await Interaction.find({
      toUser: userId,
      type: "like",
    })
      .sort({ createdAt: -1 })
      .lean();

    if (receivedLikes.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          likes: [],
          count: 0,
        },
      });
    }

    /*
     * Get the profiles belonging to the users
     * who liked the current user.
     */
    const fromUserIds = receivedLikes.map(
      (interaction) => interaction.fromUser
    );

    const profiles = await Profile.find({
      user: { $in: fromUserIds },
      isDiscoverable: true,
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

    /*
     * Populate with match() can leave user as null.
     * Remove incomplete profiles.
     */
    const validProfiles = profiles.filter(
      (profile) => profile.user
    );

    /*
     * Keep the same order as the actual received likes:
     * newest like first.
     */
    const profileMap = new Map(
      validProfiles.map((profile) => [
        profile.user._id.toString(),
        profile,
      ])
    );

    const likes = receivedLikes
      .map((interaction) => {
        const profile = profileMap.get(
          interaction.fromUser.toString()
        );

        if (!profile) {
          return null;
        }

        return {
          id: profile._id.toString(),

          userId: profile.user._id.toString(),

          name: profile.user.name,

          age: profile.dateOfBirth
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
            : null,

          gender: profile.gender,

          bio: profile.bio,

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

          likedAt: interaction.createdAt,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      data: {
        likes,
        count: likes.length,
      },
    });
  } catch (error) {
    console.error(
      "Received likes error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load people who liked you.",
    });
  }
};

/*
 * Get profiles that the current user
 * has liked or superliked.
 */
export const getSentLikes = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    /*
     * Find profiles that the current user
     * has liked or superliked.
     */
    const sentInteractions =
      await Interaction.find({
        fromUser: userId,
        type: {
          $in: ["like", "superlike"],
        },
      })
        .sort({ createdAt: -1 })
        .lean();

    if (sentInteractions.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          likes: [],
          count: 0,
        },
      });
    }

    /*
     * Get the actual profiles of the users
     * we interacted with.
     */
    const targetUserIds = sentInteractions.map(
      (interaction) => interaction.toUser
    );

    const profiles = await Profile.find({
      user: {
        $in: targetUserIds,
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
     * Keep the same order as the interaction history:
     * newest like/superlike first.
     */
    const likes = sentInteractions
      .map((interaction) => {
        const profile = profileMap.get(
          interaction.toUser.toString()
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
          id: profile._id.toString(),

          userId: profile.user._id.toString(),

          name: profile.user.name,

          age,

          gender: profile.gender,

          bio: profile.bio,

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

          interactionType:
            interaction.type,

          likedAt:
            interaction.createdAt,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      data: {
        likes,
        count: likes.length,
      },
    });
  } catch (error) {
    console.error(
      "Sent likes error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load your likes.",
    });
  }
};