import { Users } from "lucide-react";

const getInitials = (name = "") => {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const PresencePanel = ({ users = [], currentUserId }) => {
  if (users.length === 0) return null;

  const visibleUsers = users.slice(0, 5);
  const overflowCount = users.length - visibleUsers.length;

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <Users className="w-3.5 h-3.5 text-emerald-500" />
        <span>{users.length} online</span>
      </div>

      <div className="flex items-center">
        {visibleUsers.map((u, idx) => {
          const isCurrentUser = u.clientId === currentUserId;
          return (
            <div
              key={u.clientId || idx}
              className="relative -ml-1.5 first:ml-0"
              title={`${u.name}${isCurrentUser ? " (you)" : ""}`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-white dark:ring-slate-800 shadow-sm"
                style={{ backgroundColor: u.color || "#6366f1" }}
              >
                {getInitials(u.name)}
              </div>
              <span
                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-800"
                aria-label="Online"
              />
            </div>
          );
        })}

        {overflowCount > 0 && (
          <div
            className="w-8 h-8 rounded-full -ml-1.5 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-800"
            title={`${overflowCount} more online`}
          >
            +{overflowCount}
          </div>
        )}
      </div>
    </div>
  );
};

export default PresencePanel;
