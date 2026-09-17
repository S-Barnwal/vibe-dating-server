import crypto from "crypto";
import Call from "../models/Call.js";
import Match from "../models/Match.js";
import Block from "../models/Block.js";
import { getUserSocketId } from "../socket/call.socket.js";

/*
|--------------------------------------------------------------------------
| Helper: Check whether two users are matched
|--------------------------------------------------------------------------
*/

const areUsersMatched = async (userId, otherUserId) => {
  const match = await Match.findOne({
    $or: [
      {
        user1: userId,
        user2: otherUserId,
      },
      {
        user1: otherUserId,
        user2: userId,
      },
    ],
    status: "matched",
  });

  return !!match;
};

/*
|--------------------------------------------------------------------------
| Helper: Check whether users have blocked each other
|--------------------------------------------------------------------------
*/

const areUsersBlocked = async (userId, otherUserId) => {
  const block = await Block.findOne({
    $or: [
      {
        blocker: userId,
        blocked: otherUserId,
      },
      {
        blocker: otherUserId,
        blocked: userId,
      },
    ],
  });

  return !!block;
};

/*
|--------------------------------------------------------------------------
| Start Voice Call
|--------------------------------------------------------------------------
*/

export const startCall = async (req, res) => {
  try {
    const callerId = req.user._id;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Receiver ID is required",
      });
    }

    if (callerId.toString() === receiverId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot call yourself",
      });
    }

    // Check blocked users
    const blocked = await areUsersBlocked(callerId, receiverId);

    if (blocked) {
      return res.status(403).json({
        success: false,
        message: "You cannot call this user",
      });
    }

    // Check whether users are matched
    const matched = await areUsersMatched(callerId, receiverId);

    if (!matched) {
      return res.status(403).json({
        success: false,
        message: "You can only call your matched users",
      });
    }

    // Check existing active/ringing call
    const existingCall = await Call.findOne({
      $or: [
        {
          caller: callerId,
          receiver: receiverId,
        },
        {
          caller: receiverId,
          receiver: callerId,
        },
      ],
      status: {
        $in: ["ringing", "accepted"],
      },
    });

    if (existingCall) {
      return res.status(409).json({
        success: false,
        message: "There is already an active call between these users",
        call: existingCall,
      });
    }

    // Generate unique Agora channel name
    const channelName = `voice_${crypto.randomUUID()}`;

    const call = await Call.create({
      caller: callerId,
      receiver: receiverId,
      type: "voice",
      status: "ringing",
      channelName,
      startedAt: new Date(),
    });

    const receiverSocketId = getUserSocketId(receiverId);

if (receiverSocketId) {
  const io = req.app.get("io");

  io.to(receiverSocketId).emit("incoming_call", {
    call: populatedCall,
  });
}
    return res.status(201).json({
      success: true,
      message: "Voice call started",
      call: populatedCall,
    });
  } catch (error) {
    console.error("Start Call Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to start voice call",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Accept Voice Call
|--------------------------------------------------------------------------
*/

export const acceptCall = async (req, res) => {
  try {
    const userId = req.user._id;
    const { callId } = req.params;

    const call = await Call.findById(callId);

    if (!call) {
      return res.status(404).json({
        success: false,
        message: "Call not found",
      });
    }

    // Only receiver can accept the call
    if (call.receiver.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to accept this call",
      });
    }

    if (call.status !== "ringing") {
      return res.status(400).json({
        success: false,
        message: "This call is no longer ringing",
      });
    }

    call.status = "accepted";
    call.answeredAt = new Date();

    await call.save();

    const populatedCall = await Call.findById(call._id)
      .populate("caller", "name username profileImage")
      .populate("receiver", "name username profileImage");

    return res.status(200).json({
      success: true,
      message: "Call accepted",
      call: populatedCall,
    });
  } catch (error) {
    console.error("Accept Call Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to accept call",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Reject Voice Call
|--------------------------------------------------------------------------
*/

export const rejectCall = async (req, res) => {
  try {
    const userId = req.user._id;
    const { callId } = req.params;

    const call = await Call.findById(callId);

    if (!call) {
      return res.status(404).json({
        success: false,
        message: "Call not found",
      });
    }

    // Only receiver can reject the call
    if (call.receiver.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to reject this call",
      });
    }

    if (call.status !== "ringing") {
      return res.status(400).json({
        success: false,
        message: "This call is no longer ringing",
      });
    }

    call.status = "rejected";
    call.endedAt = new Date();
    call.durationSeconds = 0;

    await call.save();

    return res.status(200).json({
      success: true,
      message: "Call rejected",
      call,
    });
  } catch (error) {
    console.error("Reject Call Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reject call",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| End Voice Call
|--------------------------------------------------------------------------
*/

export const endCall = async (req, res) => {
  try {
    const userId = req.user._id;
    const { callId } = req.params;

    const call = await Call.findById(callId);

    if (!call) {
      return res.status(404).json({
        success: false,
        message: "Call not found",
      });
    }

    // Only caller or receiver can end the call
    const isCaller = call.caller.toString() === userId.toString();
    const isReceiver = call.receiver.toString() === userId.toString();

    if (!isCaller && !isReceiver) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this call",
      });
    }

    if (call.status === "ended" || call.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Call has already ended",
      });
    }

    const endedAt = new Date();

    call.status = "ended";
    call.endedAt = endedAt;

    // Calculate duration only for accepted calls
    if (call.answeredAt) {
      call.durationSeconds = Math.max(
        0,
        Math.floor(
          (endedAt.getTime() - call.answeredAt.getTime()) / 1000
        )
      );
    } else {
      call.durationSeconds = 0;
    }

    await call.save();

    const populatedCall = await Call.findById(call._id)
      .populate("caller", "name username profileImage")
      .populate("receiver", "name username profileImage");

    return res.status(200).json({
      success: true,
      message: "Call ended",
      call: populatedCall,
    });
  } catch (error) {
    console.error("End Call Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to end call",
      error: error.message,
    });
  }
};