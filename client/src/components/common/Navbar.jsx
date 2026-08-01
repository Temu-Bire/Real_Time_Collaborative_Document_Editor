import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow px-8 py-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-indigo-600">
        SyncWrite
      </h1>

      <div className="flex items-center gap-5">
        <span className="font-medium">
          {user?.name}
        </span>

        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;