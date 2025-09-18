import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Roster from './pages/Roster';
import LeaveRequests from './pages/LeaveRequests';




function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/roster" element={<Roster />} />
        <Route path="/leave-requests" element={<LeaveRequests />} />
      </Routes>
    </Router>
  );
}

export default App;
