const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      enum: ["document_shared", "role_changed", "comment", "reply"],
      required: true,
    },

    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      default: null,
    },

    title: {
      type: String,
      default: "",
    },

    message: {
      type: String,
      default: "",
    },

    read: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
