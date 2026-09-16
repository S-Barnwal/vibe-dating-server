import mongoose from "mongoose";

import Match from "../models/Match.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Profile from "../models/Profile.js";

const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) {
        return null;
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
        (monthDifference === 0 &&
            today.getDate() < birthDate.getDate())
    ) {
        age--;
    }

    return age;
};

const areUsersMatched = async (
    userId,
    otherUserId
) => {
    const firstUser = new mongoose.Types.ObjectId(
        userId
    );

    const secondUser = new mongoose.Types.ObjectId(
        otherUserId
    );

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
    let conversation =
        await Conversation.findOne({
            participants: {
                $all: [userId, otherUserId],
            },
        });

    if (!conversation) {
        conversation =
            await Conversation.create({
                participants: [
                    userId,
                    otherUserId,
                ],
            });
    }

    return conversation;
};

/*
 * ==========================================
 * GET CONVERSATION
 * ==========================================
 */

export const getConversation = async (
    req,
    res
) => {
    try {
        const userId = req.userId;

        const {
            userId: otherUserId,
        } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required.",
            });
        }

        if (!otherUserId) {
            return res.status(400).json({
                success: false,
                message:
                    "Other user is required.",
            });
        }

        if (
            !mongoose.Types.ObjectId.isValid(
                otherUserId
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID.",
            });
        }

        /*
         * ========================================
         * CHECK MATCH
         * ========================================
         */

        const match = await areUsersMatched(
            userId,
            otherUserId
        );

        if (!match) {
            return res.status(403).json({
                success: false,
                message:
                    "You can only chat with your matches.",
            });
        }

        /*
         * ========================================
         * GET OTHER USER PROFILE
         * ========================================
         */

        const otherProfile =
            await Profile.findOne({
                user: otherUserId,
            })
                .populate({
                    path: "user",
                    select:
                        "name isEmailVerified profileCompleted",
                })
                .lean();

        if (
            !otherProfile ||
            !otherProfile.user
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Matched user's profile could not be found.",
            });
        }

        /*
         * ========================================
         * CREATE / GET CONVERSATION
         * ========================================
         */

        const conversation =
            await getOrCreateConversation(
                userId,
                otherUserId
            );

        /*
         * ========================================
         * GET MESSAGES
         * ========================================
         */

        const messages =
            await Message.find({
                conversation:
                    conversation._id,
            })
                .sort({
                    createdAt: 1,
                })
                .lean();

        /*
         * ========================================
         * RESPONSE
         * ========================================
         */

        return res.status(200).json({
            success: true,

            data: {
                /*
                 * Matched user's profile
                 */
                otherUser: {
                    id: otherProfile.user._id.toString(),

                    profileId: otherProfile._id.toString(),

                    name:
                        otherProfile.user.name,

                    age: calculateAge(
                        otherProfile.dateOfBirth
                    ),

                    primaryPhoto:
                        otherProfile.photos?.[0] ||
                        null,

                    photos:
                        otherProfile.photos || [],

                    isVerified:
                        otherProfile.isVerified ||
                        otherProfile.user
                            .isEmailVerified ||
                        false,

                    lastActiveAt:
                        otherProfile.lastActiveAt ||
                        null,

                    gender:
                        otherProfile.gender || "",

                    bio:
                        otherProfile.bio || "",

                    description:
                        otherProfile.description ||
                        "",

                    interests:
                        otherProfile.interests ||
                        [],

                    datingIntention:
                        otherProfile.datingIntention ||
                        "",

                    prompts:
                        otherProfile.prompts ||
                        [],
                },

                /*
                 * Conversation information
                 */
                conversation: {
                    id: conversation._id.toString(),

                    participants:
                        conversation.participants.map(
                            (participant) =>
                                participant.toString()
                        ),
                },

                /*
                 * Messages
                 */
                messages:
                    messages.map((message) => ({
                        id: message._id.toString(),

                        conversation:
                            message.conversation.toString(),

                        sender:
                            message.sender.toString(),

                        receiver:
                            message.receiver.toString(),

                        text: message.text,

                        isRead:
                            message.isRead,

                        readAt:
                            message.readAt,

                        createdAt:
                            message.createdAt,

                        updatedAt:
                            message.updatedAt,

                        /*
                         * Used by mobile UI
                         */
                        mine:
                            message.sender.toString() ===
                            userId.toString(),
                    })),
            },
        });
    } catch (error) {
        console.error(
            "Get conversation error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load conversation.",
        });
    }
};

/*
 * ==========================================
 * SEND MESSAGE
 * ==========================================
 */

export const sendMessage = async (
    req,
    res
) => {
    try {
        const userId = req.userId;

        const {
            userId: receiverId,
        } = req.params;

        const { text } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required.",
            });
        }

        if (!receiverId) {
            return res.status(400).json({
                success: false,
                message:
                    "Receiver is required.",
            });
        }

        if (
            !mongoose.Types.ObjectId.isValid(
                receiverId
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid receiver ID.",
            });
        }

        if (
            typeof text !== "string" ||
            !text.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Message cannot be empty.",
            });
        }

        const cleanText =
            text.trim();

        if (cleanText.length > 1000) {
            return res.status(400).json({
                success: false,
                message:
                    "Message cannot exceed 1000 characters.",
            });
        }

        if (
            userId.toString() ===
            receiverId.toString()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "You cannot message yourself.",
            });
        }

        /*
         * ========================================
         * CHECK MATCH
         * ========================================
         */

        const match = await areUsersMatched(
            userId,
            receiverId
        );

        if (!match) {
            return res.status(403).json({
                success: false,
                message:
                    "You can only message your matches.",
            });
        }

        /*
         * ========================================
         * GET / CREATE CONVERSATION
         * ========================================
         */

        const conversation =
            await getOrCreateConversation(
                userId,
                receiverId
            );

        /*
         * ========================================
         * CREATE MESSAGE
         * ========================================
         */

        const message =
            await Message.create({
                conversation:
                    conversation._id,

                sender: userId,

                receiver: receiverId,

                text: cleanText,
            });

        /*
         * ========================================
         * UPDATE LAST MESSAGE
         * ========================================
         */

        conversation.lastMessage =
            message._id;

        conversation.lastMessageAt =
            message.createdAt;

        await conversation.save();

        /*
         * ========================================
         * RESPONSE
         * ========================================
         */

        return res.status(201).json({
            success: true,

            message: "Message sent.",

            data: {
                message: {
                    id: message._id.toString(),

                    conversation:
                        message.conversation.toString(),

                    sender:
                        message.sender.toString(),

                    receiver:
                        message.receiver.toString(),

                    text: message.text,

                    isRead:
                        message.isRead,

                    readAt:
                        message.readAt,

                    createdAt:
                        message.createdAt,

                    updatedAt:
                        message.updatedAt,

                    mine: true,
                },
            },
        });
    } catch (error) {
        console.error(
            "Send message error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to send message.",
        });
    }
};

/*
 * ==========================================
 * MARK MESSAGES AS READ
 * ==========================================
 */

export const markMessagesAsRead = async (
    req,
    res
) => {
    try {
        const userId = req.userId;

        const {
            userId: otherUserId,
        } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required.",
            });
        }

        if (!otherUserId) {
            return res.status(400).json({
                success: false,
                message:
                    "Other user is required.",
            });
        }

        if (
            !mongoose.Types.ObjectId.isValid(
                otherUserId
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid user ID.",
            });
        }

        /*
         * ========================================
         * CHECK MATCH
         * ========================================
         */

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

        /*
         * ========================================
         * FIND CONVERSATION
         * ========================================
         */

        const conversation =
            await Conversation.findOne({
                participants: {
                    $all: [
                        userId,
                        otherUserId,
                    ],
                },
            });

        if (!conversation) {
            return res.status(200).json({
                success: true,
                message:
                    "No messages to mark.",
            });
        }

        /*
         * ========================================
         * MARK RECEIVED MESSAGES AS READ
         * ========================================
         */

        await Message.updateMany(
            {
                conversation:
                    conversation._id,

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
            message:
                "Messages marked as read.",
        });
    } catch (error) {
        console.error(
            "Mark messages read error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to update message status.",
        });
    }
};