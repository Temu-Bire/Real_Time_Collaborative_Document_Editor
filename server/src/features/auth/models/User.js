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
      select: false, // Never return password by default
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
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    // Password reset
    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },

    // Account lockout for brute-force protection
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    lockUntil: {
      type: Date,
      select: false,
    },

    // Refresh token storage (hashed)
    refreshToken: {
      type: String,
      select: false,
    },

    refreshTokenExpires: {
      type: Date,
      select: false,
    },

    // Last login tracking
    lastLoginAt: {
      type: Date,
    },

    // Recently opened documents (per user), capped list
    recentDocuments: [
      {
        document: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Document",
          required: true,
        },
        openedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Virtual for checking if account is locked
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Indexes
// Note: unique: true on email and googleId already creates indexes
// userSchema.index({ email: 1 });  // Created by unique: true
// userSchema.index({ googleId: 1 });  // Created by unique: true
userSchema.index({ refreshToken: 1 });

module.exports = mongoose.model("User", userSchema);