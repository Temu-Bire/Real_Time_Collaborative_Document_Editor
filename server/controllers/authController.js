const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1d" });

const userPublicFields = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  profilePicture: user.profilePicture,
  isEmailVerified: user.isEmailVerified,
});

// ─── REGISTER ────────────────────────────────────────────────────────────────

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      authProvider: "local",
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    // TODO: Send verification email using your email provider (Nodemailer, Resend, etc.)
    // sendVerificationEmail(user.email, verificationToken);
    console.log(`[DEV] Email verification token for ${email}: ${verificationToken}`);

    res.status(201).json({
      message: "User registered successfully. Please verify your email.",
      user: userPublicFields(user),
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user._id);

    res.status(200).json({
      message: "Login successful",
      token,
      user: userPublicFields(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── GOOGLE LOGIN ─────────────────────────────────────────────────────────────

const googleLogin = async (req, res) => {
  try {
    // @react-oauth/google implicit flow sends access_token.
    // credential flow sends idToken. We support both.
    const { idToken, access_token } = req.body;

    let googleId, email, name, picture, email_verified;

    if (access_token) {
      // Verify the access token by calling Google's userinfo endpoint
      const fetch = (await import("node-fetch")).default;
      const googleRes = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );

      if (!googleRes.ok) {
        return res.status(401).json({ message: "Invalid Google access token" });
      }

      const payload = await googleRes.json();
      googleId = payload.sub;
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
      email_verified = payload.email_verified;
    } else if (idToken) {
      // Legacy: verify via google-auth-library
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      googleId = payload.sub;
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
      email_verified = payload.email_verified;
    } else {
      return res.status(400).json({ message: "Google token is required" });
    }

    if (!email_verified) {
      return res.status(400).json({ message: "Google email is not verified" });
    }

    let user = await User.findOne({ googleId });

    if (!user) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          message: "An account with this email already exists. Please sign in with your password.",
        });
      }

      user = await User.create({
        name,
        email,
        googleId,
        profilePicture: picture,
        authProvider: "google",
        isEmailVerified: true, // Google verifies email
      });
    }

    const token = signToken(user._id);

    res.status(200).json({
      message: "Google login successful",
      token,
      user: userPublicFields(user),
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(401).json({ message: "Invalid Google authentication" });
  }
};

// ─── LOGOUT ──────────────────────────────────────────────────────────────────

const logout = async (req, res) => {
  // JWT is stateless — the client removes the token.
  // If you implement a token denylist / refresh tokens, add that logic here.
  res.status(200).json({ message: "Logged out successfully" });
};

// ─── PROFILE ─────────────────────────────────────────────────────────────────

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "-password -emailVerificationToken -passwordResetToken"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Always respond success to prevent user enumeration
    if (!user || user.authProvider === "google") {
      return res.status(200).json({
        message: "If an account with that email exists, a reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    // TODO: Send reset email using your email provider
    // sendPasswordResetEmail(user.email, resetUrl);
    console.log(`[DEV] Password reset URL for ${email}: ${resetUrl}`);

    res.status(200).json({
      message: "If an account with that email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── RESET PASSWORD ──────────────────────────────────────────────────────────

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── RESEND VERIFICATION EMAIL ────────────────────────────────────────────────

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.authProvider === "google") {
      // Don't expose whether account exists
      return res.status(200).json({ message: "Verification email sent if account exists." });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    // TODO: Send verification email
    console.log(`[DEV] Resend verification token for ${email}: ${verificationToken}`);

    res.status(200).json({ message: "Verification email sent." });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── VERIFY EMAIL ─────────────────────────────────────────────────────────────

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  resendVerification,
  verifyEmail,
};