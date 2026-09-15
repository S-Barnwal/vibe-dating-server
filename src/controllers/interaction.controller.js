import Interaction from "../models/interaction.model.js";
import Profile from "../models/Profile.js";

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

    const message =
      req.interactionType === "like"
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