import { Link, useNavigate } from 'react-router-dom'; // For routing and navigation
import { useAuth } from '../context/AuthContext'; // Access authentication context

const Navbar = () => {
  const { user, logout } = useAuth(); // Get current user and logout function
  const navigate = useNavigate(); // Hook to programmatically navigate routes

  // Handle logout and redirect to login page
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
      {/* App title/link to home */}
      <Link to="/" className="text-2xl font-bold">
        Shift and Leave Management System
      </Link>

      {/* Conditional rendering based on authentication status */}
      <div>
        {user ? (
          // If user is logged in
          <>
            <Link to="/profile" className="mr-4">Profile</Link>
            <Link to="/roster" className="mr-4">Roster</Link>
            <Link to="/leave-requests" className="mr-4">Leave Requests</Link>
            <Link to="/overtime-requests" className="mr-4">Overtime Requests</Link>

            <button
              onClick={handleLogout}
              className="bg-red-500 px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </>
        ) : (
          // If user is not logged in
          <>
            <Link to="/login" className="mr-4">Login</Link>
            <Link
              to="/register"
              className="bg-green-500 px-4 py-2 rounded hover:bg-green-700"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
