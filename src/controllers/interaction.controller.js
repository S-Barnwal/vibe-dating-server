import Interaction from "../models/interaction.model.js";
import Profile from "../models/Profile.js";

const createInteraction = async (req, res) => {
  try {
    const fromUserId = req.user._id;
    const { toUserId } = req.body;

    if (!toUserId) {
      return res.status(400).json({
        success: false,
        message: "Target user is required",
      });
    }

    if (fromUserId.toString() === toUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot interact with yourself",
      });
    }

    const targetProfile = await Profile.findOne({
      user: toUserId,
    });

    if (!targetProfile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    const interaction = await Interaction.findOneAndUpdate(
      {
        fromUser: fromUserId,
        toUser: toUserId,
      },
      {
        fromUser: fromUserId,
        toUser: toUserId,
        type: req.interactionType,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
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
          id: interaction._id,
          toUser: interaction.toUser,
          type: interaction.type,
          createdAt: interaction.createdAt,
          updatedAt: interaction.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Interaction error:", error);

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