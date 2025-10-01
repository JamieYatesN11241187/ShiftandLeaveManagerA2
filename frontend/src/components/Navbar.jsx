import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Shared styles for tabs
  const tabClasses = ({ isActive }) =>
    `px-4 py-2 rounded-full font-medium transition
     ${isActive ? "bg-orange-400 text-blue-900" : "text-white/90 hover:text-white hover:bg-white/10"}`;

  const closeMobile = () => setIsOpen(false);

  return (
    <nav className="bg-blue-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        {/* Left side: Icon + Title */}
        <div className="flex items-center">
          {/* Orange icon box */}
          <div className="h-12 w-12 rounded-xl bg-orange-400 flex items-center justify-center shadow">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 text-blue-900"
              fill="currentColor"
            >
              <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" />
            </svg>
          </div>
          {/* Brand / Title */}
          <span to="/" className="ml-3 text-2xl font-bold">
            Shift and Leave Management System
          </span>
        </div>
        {/* Hamburger */}
        <button
          className="md:hidden p-2 rounded hover:bg-white/10"
          onClick={() => setIsOpen((o) => !o)}
          aria-label="Toggle navigation"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <NavLink to="/overtime-requests" className={tabClasses}>
                Overtime
              </NavLink>
              <NavLink to="/leave-requests" className={tabClasses}>
                Leave
              </NavLink>
              <NavLink to="/roster" className={tabClasses}>
                Shift roster
              </NavLink>

              {/* Profile (kept simple text; swap for icon if you like) */}
              <NavLink to="/profile" className={tabClasses}>
                Profile
              </NavLink>

              <button
                onClick={handleLogout}
                className={tabClasses}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={tabClasses}>
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={tabClasses}
              >
                Register
              </NavLink>
            </>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden px-4 pb-4">
          <div className="bg-blue-900 rounded-lg shadow-lg p-4 space-y-3">
            {user ? (
              <>
                <NavLink to="/overtime-requests" className={tabClasses} onClick={closeMobile}>
                  Overtime
                </NavLink>
                <NavLink to="/leave-requests" className={tabClasses} onClick={closeMobile}>
                  Leave
                </NavLink>
                <NavLink to="/roster" className={tabClasses} onClick={closeMobile}>
                  Shift roster
                </NavLink>
                <NavLink
                  to="/profile"
                  className={tabClasses}
                  onClick={closeMobile}
                >
                  Profile
                </NavLink>
                <button
                  onClick={() => {
                    closeMobile();
                    handleLogout();
                  }}
                  className={tabClasses}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={tabClasses} onClick={closeMobile}>
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className={tabClasses}
                  onClick={closeMobile}
                >
                  Register
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;