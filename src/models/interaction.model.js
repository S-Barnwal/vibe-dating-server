import mongoose from "mongoose";

const interactionSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["like", "pass", "superlike"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

interactionSchema.index(
  {
    fromUser: 1,
    toUser: 1,
  },
  {
    unique: true,
  }
);

const Interaction = mongoose.model(
  "Interaction",
  interactionSchema
);

export default Interaction;