import mongoose from "mongoose";

import Match from "../models/Match.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

const areUsersMatched = async (userId, otherUserId) => {
  const firstUser = new mongoose.Types.ObjectId(userId);
  const secondUser = new mongoose.Types.ObjectId(otherUserId);

  const userIds = [
    firstUser.toString(),
    secondUser.toString(),
  ].sort();

  const match = await Match.findOne({
    user1: userIds[0],
    user2: userIds[1],
  });

  return match;
};

const getOrCreateConversation = async (
  userId,
  otherUserId
) => {
  let conversation = await Conversation.findOne({
    participants: {
      $all: [userId, otherUserId],
    },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, otherUserId],
    });
  }

  return conversation;
};

export const getConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { userId: otherUserId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        message: "Other user is required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const match = await areUsersMatched(
      userId,
      otherUserId
    );

    if (!match) {
      return res.status(403).json({
        success: false,
        message: "You can only chat with your matches.",
      });
    }

    const conversation = await getOrCreateConversation(
      userId,
      otherUserId
    );

    const messages = await Message.find({
      conversation: conversation._id,
    })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        conversation: {
          id: conversation._id.toString(),
          participants: conversation.participants.map(
            (participant) => participant.toString()
          ),
        },

        messages: messages.map((message) => ({
          id: message._id.toString(),
          conversation: message.conversation.toString(),
          sender: message.sender.toString(),
          receiver: message.receiver.toString(),
          text: message.text,
          isRead: message.isRead,
          readAt: message.readAt,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,

          // Important for mobile UI
          mine:
            message.sender.toString() ===
            userId.toString(),
        })),
      },
    });
  } catch (error) {
    console.error("Get conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load conversation.",
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { userId: receiverId } = req.params;
    const { text } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Receiver is required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid receiver ID.",
      });
    }

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty.",
      });
    }

    const cleanText = text.trim();

    if (cleanText.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Message cannot exceed 1000 characters.",
      });
    }

    if (userId.toString() === receiverId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot message yourself.",
      });
    }

    const match = await areUsersMatched(
      userId,
      receiverId
    );

    if (!match) {
      return res.status(403).json({
        success: false,
        message: "You can only message your matches.",
      });
    }

    const conversation = await getOrCreateConversation(
      userId,
      receiverId
    );

    const message = await Message.create({
      conversation: conversation._id,
      sender: userId,
      receiver: receiverId,
      text: cleanText,
    });

    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;

    await conversation.save();

    return res.status(201).json({
      success: true,
      message: "Message sent.",

      data: {
        message: {
          id: message._id.toString(),
          conversation: message.conversation.toString(),
          sender: message.sender.toString(),
          receiver: message.receiver.toString(),
          text: message.text,
          isRead: message.isRead,
          readAt: message.readAt,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,

          // Sent message is always mine
          mine: true,
        },
      },
    });
  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send message.",
    });
  }
};

export const markMessagesAsRead = async (
  req,
  res
) => {
  try {
    const userId = req.userId;
    const { userId: otherUserId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        message: "Other user is required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const match = await areUsersMatched(
      userId,
      otherUserId
    );

    if (!match) {
      return res.status(403).json({
        success: false,
        message:
          "You can only access messages from your matches.",
      });
    }

    const conversation = await Conversation.findOne({
      participants: {
        $all: [userId, otherUserId],
      },
    });

    if (!conversation) {
      return res.status(200).json({
        success: true,
        message: "No messages to mark.",
      });
    }

    await Message.updateMany(
      {
        conversation: conversation._id,
        receiver: userId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Messages marked as read.",
    });
  } catch (error) {
    console.error("Mark messages read error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update message status.",
    });
  }
};