import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Access authentication context
import axiosInstance from '../axiosConfig'; // Axios instance with base URL and config
import { useMemento } from '../hooks/useMemento';

const Profile = () => {
  const { user, setUser } = useAuth(); // Get user and updater function from context

  // Memento-based state management for form data
  const { state: formData, setState: setFormData, reset, undo, redo, canUndo, canRedo } = useMemento({
    name: '',
    email: '',
    role: '',
    address: '',
  });

  const [loading, setLoading] = useState(false); // Track loading state for async operations

  useEffect(() => {
    // Fetch current user profile from backend on component mount
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('/api/auth/profile', {
          headers: { Authorization: `Bearer ${user.token}` }, // Pass token for authentication
        });

        // Populate form with fetched profile data and reset memento history
        const profileData = {
          name: response.data.name,
          email: response.data.email,
          role: response.data.role || '',
          address: response.data.address || '',
        };
        reset(profileData);
      } catch (error) {
        alert('Failed to fetch profile. Please try again.');
      } finally {
        setLoading(false); // End loading state
      }
    };

    if (user) fetchProfile(); // Only fetch if user is authenticated
  }, [user, reset]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Proper case for name
    if (name === 'name') {
      const properCaseName = value.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
      setFormData({ ...formData, [name]: properCaseName });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle form submission to update profile
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.put('/api/auth/profile', formData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      // Notify success with updated values
      alert(`Profile updated successfully!\n\nName: ${formData.name}\nEmail: ${formData.email}\nRole: ${formData.role}\nAddress: ${formData.address}`);

      // If a new token is returned, update both local storage and context
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setUser({ ...user, role: formData.role, token: response.data.token });
      } else {
        setUser({ ...user, role: formData.role });
      }

      // Reset memento with the new submitted data
      reset(formData);
    } catch (error) {
      alert('Failed to update profile. Please try again.');
      console.log(error); // Log error for debugging
    } finally {
      setLoading(false); // End loading state
    }
  };

  // Show loading text while data is being fetched or updated
  if (loading) {
    return <div className="text-center mt-20">Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <form onSubmit={handleSubmit} className="bg-white p-6 shadow-md rounded">
        <h1 className="text-2xl font-bold mb-4 text-center">Your Profile</h1>

        {/* Name input field */}
        <input
          type="text"
          placeholder="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full mb-4 p-2 border rounded"
        />

        {/* Email input field */}
        <input
          type="email"
          placeholder="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full mb-4 p-2 border rounded"
        />

        {/* Role dropdown */}
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full mb-4 p-2 border rounded"
          required
        >
          <option value="" disabled>Select a role</option>
          <option value="manager">Manager</option>
          <option value="worker">Worker</option>
        </select>

        {/* Address input field */}
        <input
          type="text"
          placeholder="Address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="w-full mb-4 p-2 border rounded"
        />

        {/* Undo/Redo Buttons */}
        <div className="flex justify-between mb-4">
          <button type="button" onClick={undo} disabled={!canUndo} className="bg-green-400 text-white p-2 rounded disabled:opacity-50">
            Undo
          </button>
          <button type="button" onClick={redo} disabled={!canRedo} className="bg-green-400 text-white p-2 rounded disabled:opacity-50">
            Redo
          </button>
        </div>

        {/* Submit button */}
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
};

export default Profile;