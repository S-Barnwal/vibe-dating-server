import crypto from "crypto";

import Call from "../models/Call.js";
import Match from "../models/Match.js";
import Block from "../models/Block.js";

import {
  getUserSocketId,
} from "../socket/call.socket.js";

/*
|--------------------------------------------------------------------------
| Helper: Check whether two users are matched
|--------------------------------------------------------------------------
*/

const areUsersMatched = async (
  userId,
  otherUserId
) => {
  const userIds = [
    userId.toString(),
    otherUserId.toString(),
  ].sort();

  const match = await Match.findOne({
    user1: userIds[0],
    user2: userIds[1],
  });

  return !!match;
};

/*
|--------------------------------------------------------------------------
| Helper: Check whether users have blocked each other
|--------------------------------------------------------------------------
*/

const areUsersBlocked = async (
  userId,
  otherUserId
) => {
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
| Helper: Populate call users
|--------------------------------------------------------------------------
*/

const populateCall = async (callId) => {
  return await Call.findById(callId)
    .populate(
      "caller",
      "name username profileImage"
    )
    .populate(
      "receiver",
      "name username profileImage"
    );
};

/*
|--------------------------------------------------------------------------
| Start Voice Call
|--------------------------------------------------------------------------
*/

export const startCall = async (req, res) => {
  try {
    const callerId = req.userId;
    const { receiverId } = req.body;

    if (!callerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Receiver ID is required",
      });
    }

    if (
      callerId.toString() ===
      receiverId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot call yourself",
      });
    }

    /*
     * Check blocked users
     */
    const blocked = await areUsersBlocked(
      callerId,
      receiverId
    );

    if (blocked) {
      return res.status(403).json({
        success: false,
        message: "You cannot call this user",
      });
    }

    /*
     * Check whether users are matched
     */
    const matched = await areUsersMatched(
      callerId,
      receiverId
    );

    if (!matched) {
      return res.status(403).json({
        success: false,
        message:
          "You can only call your matched users",
      });
    }

    /*
     * Check existing active call
     */
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
        message:
          "There is already an active call between these users",
        call: existingCall,
      });
    }

    /*
     * Generate unique channel name
     */
    const channelName = `voice_${crypto.randomUUID()}`;

    /*
     * Create call
     */
    const call = await Call.create({
      caller: callerId,
      receiver: receiverId,
      type: "voice",
      status: "ringing",
      channelName,
      startedAt: new Date(),
    });

    /*
     * Populate caller and receiver
     */
    const populatedCall = await populateCall(
      call._id
    );

    /*
     * Notify receiver through Socket.IO
     */
    const receiverSocketId =
      getUserSocketId(receiverId);

    if (receiverSocketId) {
      const io = req.app.get("io");

      if (io) {
        io.to(receiverSocketId).emit(
          "incoming_call",
          {
            call: populatedCall,
          }
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: "Voice call started",
      call: populatedCall,
    });
  } catch (error) {
    console.error(
      "Start Call Error:",
      error
    );

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
    const userId = req.userId;
    const { callId } = req.params;

    const call = await Call.findById(callId);

    if (!call) {
      return res.status(404).json({
        success: false,
        message: "Call not found",
      });
    }

    /*
     * Only receiver can accept
     */
    if (
      call.receiver.toString() !==
      userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to accept this call",
      });
    }

    if (call.status !== "ringing") {
      return res.status(400).json({
        success: false,
        message:
          "This call is no longer ringing",
      });
    }

    call.status = "accepted";
    call.answeredAt = new Date();

    await call.save();

    const populatedCall = await populateCall(
      call._id
    );

    /*
     * Notify caller
     */
    const callerSocketId = getUserSocketId(
      call.caller
    );

    if (callerSocketId) {
      const io = req.app.get("io");

      if (io) {
        io.to(callerSocketId).emit(
          "call_accepted",
          {
            call: populatedCall,
          }
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Call accepted",
      call: populatedCall,
    });
  } catch (error) {
    console.error(
      "Accept Call Error:",
      error
    );

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
    const userId = req.userId;
    const { callId } = req.params;

    const call = await Call.findById(callId);

    if (!call) {
      return res.status(404).json({
        success: false,
        message: "Call not found",
      });
    }

    /*
     * Only receiver can reject
     */
    if (
      call.receiver.toString() !==
      userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to reject this call",
      });
    }

    if (call.status !== "ringing") {
      return res.status(400).json({
        success: false,
        message:
          "This call is no longer ringing",
      });
    }

    call.status = "rejected";
    call.endedAt = new Date();
    call.durationSeconds = 0;

    await call.save();

    const populatedCall = await populateCall(
      call._id
    );

    /*
     * Notify caller
     */
    const callerSocketId = getUserSocketId(
      call.caller
    );

    if (callerSocketId) {
      const io = req.app.get("io");

      if (io) {
        io.to(callerSocketId).emit(
          "call_rejected",
          {
            call: populatedCall,
          }
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Call rejected",
      call: populatedCall,
    });
  } catch (error) {
    console.error(
      "Reject Call Error:",
      error
    );

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
    const userId = req.userId;
    const { callId } = req.params;

    const call = await Call.findById(callId);

    if (!call) {
      return res.status(404).json({
        success: false,
        message: "Call not found",
      });
    }

    /*
     * Only caller or receiver can end
     */
    const isCaller =
      call.caller.toString() ===
      userId.toString();

    const isReceiver =
      call.receiver.toString() ===
      userId.toString();

    if (!isCaller && !isReceiver) {
      return res.status(403).json({
        success: false,
        message:
          "You are not part of this call",
      });
    }

    if (
      call.status === "ended" ||
      call.status === "rejected"
    ) {
      return res.status(400).json({
        success: false,
        message: "Call has already ended",
      });
    }

    const endedAt = new Date();

    call.status = "ended";
    call.endedAt = endedAt;

    /*
     * Calculate duration only
     * for accepted calls
     */
    if (call.answeredAt) {
      call.durationSeconds = Math.max(
        0,
        Math.floor(
          (endedAt.getTime() -
            call.answeredAt.getTime()) /
            1000
        )
      );
    } else {
      call.durationSeconds = 0;
    }

    await call.save();

    const populatedCall = await populateCall(
      call._id
    );

    /*
     * Notify the other participant
     */
    const otherUserId = isCaller
      ? call.receiver
      : call.caller;

    const otherSocketId =
      getUserSocketId(otherUserId);

    if (otherSocketId) {
      const io = req.app.get("io");

      if (io) {
        io.to(otherSocketId).emit(
          "call_ended",
          {
            call: populatedCall,
          }
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Call ended",
      call: populatedCall,
    });
  } catch (error) {
    console.error(
      "End Call Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to end call",
      error: error.message,
    });
  }
};