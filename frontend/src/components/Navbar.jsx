import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // For routing and navigation
import { useAuth } from '../context/AuthContext'; // Access authentication context

const Navbar = () => {
  const { user, logout } = useAuth(); // Get current user and logout function
  const navigate = useNavigate(); // Hook to programmatically navigate routes
  const [isOpen, setIsOpen] = useState(false); // State for mobile menu

  // Handle logout and redirect to login page
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold">
        Shift and Leave Management System
      </Link>

      {/* Hamburger Menu Button */}
      <div className="md:hidden">
        <button onClick={() => setIsOpen(!isOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
          </svg>
        </button>
      </div>

      {/* Conditional rendering based on authentication status */}
      <div className="hidden md:flex items-center">
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
      {isOpen && (
        <div className="md:hidden absolute top-16 right-4 bg-blue-600 p-4 rounded shadow-lg z-50">
          <div className="flex flex-col items-start">
            {user ? (
              <>
                <Link to="/profile" className="mb-2">Profile</Link>
                <Link to="/roster" className="mb-2">Roster</Link>
                <Link to="/leave-requests" className="mb-2">Leave Requests</Link>
                <Link to="/overtime-requests" className="mb-2">Overtime Requests</Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 px-4 py-2 rounded hover:bg-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="mb-2">Login</Link>
                <Link
                  to="/register"
                  className="bg-green-500 px-4 py-2 rounded hover:bg-green-700"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;