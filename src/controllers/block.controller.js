import mongoose from "mongoose";

import Block from "../models/Block.js";
import User from "../models/User.js";
import Profile from "../models/Profile.js";

const getCurrentUserId = (req) => {
  return (
    req.userId ||
    req.user?._id ||
    req.user?.id
  );
};

/*
 * ==========================================
 * GET BLOCK STATUS
 * ==========================================
 */

export const getBlockStatus = async (
  req,
  res
) => {
  try {
    const currentUserId =
      getCurrentUserId(req);

    const { userId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    if (
      !userId ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user.",
      });
    }

    const block = await Block.findOne({
      blocker: currentUserId,
      blocked: userId,
    }).lean();

    const blockedByOther =
      await Block.findOne({
        blocker: userId,
        blocked: currentUserId,
      }).lean();

    return res.status(200).json({
      success: true,
      data: {
        isBlocked: Boolean(block),
        blockedByOther:
          Boolean(blockedByOther),
      },
    });
  } catch (error) {
    console.error(
      "Get block status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to check block status.",
    });
  }
};

/*
 * ==========================================
 * GET MY BLOCKED USERS
 * ==========================================
 */

export const getBlockedUsers = async (
  req,
  res
) => {
  try {
    const currentUserId =
      getCurrentUserId(req);

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const blocks = await Block.find({
      blocker: currentUserId,
    })
      .sort({
        createdAt: -1,
      })
      .populate({
        path: "blocked",
        select:
          "name isEmailVerified profileCompleted",
      })
      .lean();

    const blockedUserIds = blocks
      .map((block) => block.blocked?._id)
      .filter(Boolean);

    const profiles =
      await Profile.find({
        user: {
          $in: blockedUserIds,
        },
      })
        .select(
          "user dateOfBirth gender bio photos isVerified"
        )
        .lean();

    const profileMap = new Map(
      profiles.map((profile) => [
        profile.user.toString(),
        profile,
      ])
    );

    const calculateAge = (
      dateOfBirth
    ) => {
      if (!dateOfBirth) {
        return null;
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
        (monthDifference === 0 &&
          today.getDate() <
            birthDate.getDate())
      ) {
        age--;
      }

      return age;
    };

    const formattedUsers = blocks
      .filter((block) => block.blocked)
      .map((block) => {
        const user = block.blocked;

        const profile = profileMap.get(
          user._id.toString()
        );

        return {
          blockId:
            block._id.toString(),

          userId:
            user._id.toString(),

          name: user.name,

          age: profile
            ? calculateAge(
                profile.dateOfBirth
              )
            : null,

          primaryPhoto:
            profile?.photos?.[0] ||
            null,

          photos:
            profile?.photos || [],

          gender:
            profile?.gender || "",

          bio:
            profile?.bio || "",

          isVerified:
            profile?.isVerified ||
            user.isEmailVerified ||
            false,

          blockedAt:
            block.createdAt,
        };
      });

    return res.status(200).json({
      success: true,
      data: {
        users: formattedUsers,
        count: formattedUsers.length,
      },
    });
  } catch (error) {
    console.error(
      "Get blocked users error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load blocked users.",
    });
  }
};

/*
 * ==========================================
 * BLOCK USER
 * ==========================================
 */

export const blockUser = async (
  req,
  res
) => {
  try {
    const currentUserId =
      getCurrentUserId(req);

    const { userId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    if (
      !userId ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user.",
      });
    }

    if (
      currentUserId.toString() ===
      userId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot block yourself.",
      });
    }

    const targetUser =
      await User.findById(userId).select(
        "_id"
      );

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const existingBlock =
      await Block.findOne({
        blocker: currentUserId,
        blocked: userId,
      });

    if (existingBlock) {
      return res.status(200).json({
        success: true,
        message:
          "User is already blocked.",
        data: {
          block: {
            id: existingBlock._id,
            blocker:
              existingBlock.blocker,
            blocked:
              existingBlock.blocked,
          },
        },
      });
    }

    const block =
      await Block.create({
        blocker: currentUserId,
        blocked: userId,
      });

    return res.status(201).json({
      success: true,
      message:
        "User blocked successfully.",
      data: {
        block: {
          id: block._id,
          blocker: block.blocker,
          blocked: block.blocked,
        },
      },
    });
  } catch (error) {
    console.error(
      "Block user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to block this user.",
    });
  }
};

/*
 * ==========================================
 * UNBLOCK USER
 * ==========================================
 */

export const unblockUser = async (
  req,
  res
) => {
  try {
    const currentUserId =
      getCurrentUserId(req);

    const { userId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    if (
      !userId ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user.",
      });
    }

    const deletedBlock =
      await Block.findOneAndDelete({
        blocker: currentUserId,
        blocked: userId,
      });

    if (!deletedBlock) {
      return res.status(404).json({
        success: false,
        message:
          "User is not currently blocked.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "User unblocked successfully.",
    });
  } catch (error) {
    console.error(
      "Unblock user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to unblock this user.",
    });
  }
};