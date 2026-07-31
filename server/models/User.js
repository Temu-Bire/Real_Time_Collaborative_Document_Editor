const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 30,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    // Not required for Google OAuth users
    password: {
      type: String,
      minlength: 8,
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    profilePicture: {
      type: String,
    },

    // Email verification
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
    },

    emailVerificationExpires: {
      type: Date,
    },

    // Password reset
    passwordResetToken: {
      type: String,
    },

    passwordResetExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);