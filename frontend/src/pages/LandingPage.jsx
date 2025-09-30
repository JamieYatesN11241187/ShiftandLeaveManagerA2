import { Link } from "react-router-dom";


const LandingPage = () => {
  return (
    <div
      className="h-screen w-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), url('/heroImage.jpg')",
      }}
    >
      {/* White centered box */}
      <div className="bg-white bg-opacity-100 text-center p-10 rounded-xl shadow-lg max-w-xl">
        <h1 className="text-3xl md:text-5xl font-extrabold text-black mb-6">
          Shift and Leave Management System
        </h1>
        <p className="text-md md:text-2xl text-gray-500 mb-8">
          Welcome to the shift and leave manager
        </p>

        <div className="flex gap-6 justify-center">
          <Link
            to="/register"
            className="px-6 py-3 rounded-lg bg-orange-400 text-black font-semibold hover:bg-orange-600 transition"
          >
            Register
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 rounded-lg bg-orange-300 text-black font-semibold hover:bg-orange-400 transition"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
