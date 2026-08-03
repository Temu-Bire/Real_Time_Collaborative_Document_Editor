const mongoose = require("mongoose");

const documentVersionSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    content: {
      type: String,
      default: "",
    },
    contentHash: {
      type: String,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    changeDescription: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    reason: {
      type: String,
      enum: ["manual", "interval", "significant_change", "close_document", "restore"],
      default: "manual",
    },
    isAutosave: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

documentVersionSchema.index({ document: 1, versionNumber: -1 });
documentVersionSchema.index({ document: 1, createdAt: -1 });

module.exports = mongoose.model("DocumentVersion", documentVersionSchema);