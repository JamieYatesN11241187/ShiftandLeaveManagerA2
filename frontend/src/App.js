import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Roster from "./pages/Roster";
import LeaveRequests from "./pages/LeaveRequests";
import OvertimeRequests from "./pages/OvertimeRequests";
import LandingPage from "./pages/LandingPage";
import Footer from "./components/Footer";

function AppWrapper() {
  const location = useLocation();
  const isLandingPage = location.pathname === "/"; // Landing page path

  return (
    <>
      {/* Navbar (hide on landing page) */}
      {!isLandingPage && <Navbar />}

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/roster" element={<Roster />} />
        <Route path="/leave-requests" element={<LeaveRequests />} />
        <Route path="/overtime-requests" element={<OvertimeRequests />} />
        <Route path="/" element={<LandingPage />} />
      </Routes>

      {/* Footer (hide on landing page) */}
      {!isLandingPage && <Footer />}
    </>
  );
}


export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}
