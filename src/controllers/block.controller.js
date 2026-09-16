import mongoose from "mongoose";

import Block from "../models/Block.js";
import User from "../models/User.js";

const getCurrentUserId = (req) => {
  return req.userId || req.user?._id || req.user?.id;
};

// GET /api/blocks/:userId/status
export const getBlockStatus = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const { userId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user.",
      });
    }

    const block = await Block.findOne({
      blocker: currentUserId,
      blocked: userId,
    }).lean();

    const blockedByOther = await Block.findOne({
      blocker: userId,
      blocked: currentUserId,
    }).lean();

    return res.status(200).json({
      success: true,
      data: {
        isBlocked: Boolean(block),
        blockedByOther: Boolean(blockedByOther),
      },
    });
  } catch (error) {
    console.error("Get block status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to check block status.",
    });
  }
};

// POST /api/blocks/:userId
export const blockUser = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const { userId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user.",
      });
    }

    if (currentUserId.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot block yourself.",
      });
    }

    const targetUser = await User.findById(userId).select("_id");

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const existingBlock = await Block.findOne({
      blocker: currentUserId,
      blocked: userId,
    });

    if (existingBlock) {
      return res.status(200).json({
        success: true,
        message: "User is already blocked.",
        data: {
          block: {
            id: existingBlock._id,
            blocker: existingBlock.blocker,
            blocked: existingBlock.blocked,
          },
        },
      });
    }

    const block = await Block.create({
      blocker: currentUserId,
      blocked: userId,
    });

    return res.status(201).json({
      success: true,
      message: "User blocked successfully.",
      data: {
        block: {
          id: block._id,
          blocker: block.blocker,
          blocked: block.blocked,
        },
      },
    });
  } catch (error) {
    console.error("Block user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to block this user.",
    });
  }
};

// DELETE /api/blocks/:userId
export const unblockUser = async (req, res) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const { userId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user.",
      });
    }

    const deletedBlock = await Block.findOneAndDelete({
      blocker: currentUserId,
      blocked: userId,
    });

    if (!deletedBlock) {
      return res.status(404).json({
        success: false,
        message: "User is not currently blocked.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User unblocked successfully.",
    });
  } catch (error) {
    console.error("Unblock user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to unblock this user.",
    });
  }
};