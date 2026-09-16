import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    user2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    matchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * The same two users should never have
 * more than one match.
 */
matchSchema.index(
  { user1: 1, user2: 1 },
  { unique: true }
);

const Match = mongoose.model("Match", matchSchema);

export default Match;