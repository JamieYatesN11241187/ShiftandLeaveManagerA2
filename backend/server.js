
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();


const app = express();

const allowedOrigins = [
  'http://localhost:3000',          // Your local development frontend
  'http://13.55.186.158'            // Your live EC2 frontend
];

app.use(cors({
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Handle preflight requests
app.options("*", cors());

app.use(express.json());
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/shifts', require('./routes/shifts'));

app.use('/api/leave-requests', require('./routes/leaveRoutes'));
app.use('/api/overtime-requests', require('./routes/overtimeRoutes'));


// server.js
const swapRoutes = require("./routes/swaps");
app.use(express.json());            
app.use("/api/swaps", swapRoutes); 


// Export the app object for testing
if (require.main === module) {
    connectDB();
    // If the file is run directly, start the serve\/
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  }


module.exports = app
