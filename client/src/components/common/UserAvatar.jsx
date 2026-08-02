import React, { useState } from "react";

const GRADIENTS = [
  "from-indigo-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-violet-500 to-fuchsia-600",
];

const getGradient = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
};

const getInitials = (name = "") => {
  if (!name || typeof name !== "string") return "U";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const SIZES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-20 h-20 text-2xl",
};

const UserAvatar = ({ user, size = "md", className = "", onClick }) => {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(user?.name || user?.email);
  const gradientClass = getGradient(user?.name || user?.email || "User");
  const sizeClass = SIZES[size] || SIZES.md;

  const hasPhoto = user?.profilePicture && !imgError;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full ring-2 ring-indigo-500/20 dark:ring-indigo-400/30 overflow-hidden font-bold text-white shadow-sm ${sizeClass} ${className}`}
      title={user?.name || user?.email || "User"}
    >
      {hasPhoto ? (
        <img
          src={user.profilePicture}
          alt={user?.name || "Avatar"}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <span
          className={`w-full h-full bg-gradient-to-tr ${gradientClass} flex items-center justify-center tracking-wider text-white select-none`}
        >
          {initials}
        </span>
      )}
    </div>
  );
};

export default UserAvatar;
