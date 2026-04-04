// Import required modules
// express: Web framework for building APIs and handling HTTP requests.
const express = require("express");

// pg: PostgreSQL client for Node.js, using Pool for connection management.
const { Pool } = require("pg");

// bcryptjs: Library for hashing passwords securely to protect user credentials.
const bcrypt = require("bcryptjs");

// cors: Middleware for enabling Cross-Origin Resource Sharing, allowing frontend-backend communication.
const cors = require("cors");



// Create an instance of the Express application
// This is the main application object that will handle routing, middleware, and server setup.
const app = express();

// Middleware configuration
// Parse incoming JSON payloads in request bodies, enabling automatic parsing of JSON data in POST requests.
app.use(express.json());

// Enable CORS for all routes to permit cross-origin requests from the frontend.
app.use(cors());

const dns = require("dns");

const DB_USER = "postgres";
const DB_PASSWORD = "&a5La_?GvrhjJE#";
const DB_NAME = "postgres";
const DB_HOST = "db.faopqgtksrcwsbpevosm.supabase.co";
const DB_PORT = 5432;

dns.lookup(DB_HOST, { family: 4 }, (err, address) => {
  if (err) throw err;

  const pool = new Pool({
    user: DB_USER,
    password: DB_PASSWORD,
    host: address,      // IPv4 forced
    database: DB_NAME,
    port: DB_PORT,
    ssl: { rejectUnauthorized: false }
  });

  


// Database initialization function
// Creates necessary tables if they don't exist, ensuring the database schema is set up on server startup.
// Tables include users, connections (friendships), requests (pending friend requests), and messages.
const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,           -- Auto-incrementing unique identifier
      email VARCHAR(255) UNIQUE NOT NULL, -- Unique email address for each user
      password TEXT NOT NULL,          -- Hashed password for security
      theme INT DEFAULT 0              -- User preference for theme (0=default)
    );

    CREATE TABLE IF NOT EXISTS connections (
      userid INT NOT NULL,             -- First user in the connection
      userid2 INT NOT NULL,            -- Second user in the connection
      PRIMARY KEY(userid, userid2)     -- Composite primary key prevents duplicate connections
    );

    CREATE TABLE IF NOT EXISTS requests (
      senderid INT NOT NULL,           -- ID of user sending the friend request
      receiverid INT NOT NULL,         -- ID of user receiving the request
      PRIMARY KEY(senderid, receiverid) -- Composite key for unique request pairs
    );

    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,           -- Auto-incrementing message ID
      senderid INT NOT NULL,           -- ID of message sender
      receiverid INT NOT NULL,         -- ID of message receiver
      message TEXT NOT NULL,           -- Message content
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Automatic timestamp on insertion
    );
  `);
  console.log("Database initialized");
};

// Initialize the database and handle any initialization errors
initDB().catch(err => console.error("DB init error:", err));

// API Routes

// POST /register - User registration endpoint
// Handles new user sign-ups by validating input, hashing passwords, and storing user data.
// Request body: { email: string, password: string }
// Response: { message: string } - Success or error message
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;  // Extract email and password from request body
    // Hash the password asynchronously with a cost factor of 10 (higher = more secure but slower)
    const hashedPassword = await bcrypt.hash(password, 10);
    // Insert the new user into the database using parameterized query to prevent SQL injection
    await pool.query(
      "INSERT INTO users (email, password, theme) VALUES ($1, $2, 0)",
      [email, hashedPassword]
    );
    res.json({ message: "User registered successfully!" });
  } catch {
    // Catch block handles errors like duplicate email (due to UNIQUE constraint)
    res.json({ message: "User already exists or error!" });
  }
});

// POST /login - User login endpoint
// Verifies user credentials against the database and returns user data on successful authentication.
// Request body: { email: string, password: string }
// Response: { message: string, user?: { id: number, email: string, theme: number } } - Success with user data or error message
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;  // Extract credentials from request
    // Query the database for the user with the given email
    const { rows } = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    const user = rows[0];
    if (!user) return res.json({ message: "User not found!" });  // User doesn't exist
    // Compare the provided password with the hashed password in the database
    const isMatch = bcrypt.compareSync(password, user.password);
    if (isMatch) {
      // Password matches: return success message and user data (excluding password)
      res.json({ message: "Login successful!", user: { id: user.id, email: user.email, theme: user.theme } });
    } else res.json({ message: "Incorrect password!" });
  } catch {
    // Handle database errors
    res.status(500).json({ message: "Database error" });
  }
});

// POST /retreiveConnectionsData - Retrieve user's connections and friend requests
// Fetches the user's friends (connections) and pending friend requests for display in the UI.
// Request body: { userId: number }
// Response: { Connections: array, Ids: array, Requests: array } - Friends list, their IDs, and pending requests
app.post("/retreiveConnectionsData", async (req, res) => {
  try {
    const userId = Number(req.body.userId);  // Get user ID from request
    // First, query for existing connections where the user is involved
    const { rows: connectionsRows } = await pool.query(
      "SELECT userid, userid2 FROM connections WHERE userid=$1 OR userid2=$1",
      [userId]
    );
    // Extract the IDs of connected users
    const connectionsIds = connectionsRows.map(r => (r.userid === userId ? r.userid2 : r.userid));
    let connections = [];
    if (connectionsIds.length > 0) {
      // Build parameterized query for multiple IDs
      const placeholders = connectionsIds.map((_, i) => `$${i+1}`).join(",");
      const { rows } = await pool.query(`SELECT * FROM users WHERE id IN (${placeholders})`, connectionsIds);
      connections = rows;
    }
    // Fetch pending requests
    const { rows: requests } = await pool.query(
      "SELECT requests.senderid, users.email FROM requests JOIN users ON requests.senderid=users.id WHERE receiverid=$1",
      [userId]
    );
    res.json({ Connections: connections, Ids: connectionsIds, Requests: requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

// POST /sendConnctionRequest - Send friend request
// Allows users to send friend requests to other users, preventing duplicates and self-requests.
// Request body: { senderid: number, receiverid: number }
// Response: { message: string } - Success or error message
app.post("/sendConnctionRequest", async (req, res) => {
  try {
    let { senderid, receiverid } = req.body;  // Note: there's a typo in the key, should be senderId
    senderid = Number(senderid);
    receiverid = Number(receiverid);
    if (senderid === receiverid) return res.json({ message: "You can't add yourself as a friend" });  // Prevent self-requests
    // Check if they are already connected
    const { rows } = await pool.query(
      "SELECT userid, userid2 FROM connections WHERE (userid=$1 AND userid2=$2) OR (userid=$2 AND userid2=$1)",
      [senderid, receiverid]
    );
    if (rows.length > 0) return res.json({ message: "This person is already your friend" });
    // Insert new request, using ON CONFLICT to handle duplicates gracefully
    await pool.query(
      "INSERT INTO requests (senderid, receiverid) VALUES ($1, $2) ON CONFLICT (senderid, receiverid) DO NOTHING",
      [senderid, receiverid]
    );
    res.json({ message: "Connection request sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

// POST /acceptRequest - Accept friend request
// Establishes a connection between users and removes the pending request.
// Request body: { userId: number, senderid: number }
// Response: { message: string } - Success or error message
app.post("/acceptRequest", async (req, res) => {
  try {
    const { userId, senderid } = req.body;  // userId is receiver, senderid is the one who sent request
    // Check if the request exists
    const { rows } = await pool.query("SELECT * FROM requests WHERE senderid=$1 AND receiverid=$2", [senderid, userId]);
    if (rows.length === 0) return res.json({ message: "No such friend request found" });
    // Determine the order for connection (userId < userId2)
    const user1 = Math.min(userId, senderid);
    const user2 = Math.max(userId, senderid);
    // Insert into connections table, using ON CONFLICT to avoid duplicates
    await pool.query("INSERT INTO connections(userid, userid2) VALUES ($1, $2) ON CONFLICT DO NOTHING", [user1, user2]);
    // Delete the request after adding connection
    await pool.query("DELETE FROM requests WHERE senderid=$1 AND receiverid=$2", [senderid, userId]);
    res.json({ message: "Friend request accepted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

// POST /sendMessage - Send a message
// Stores a new message in the database between two users.
// Request body: { senderid: number, receiverid: number, message: string }
// Response: { message: string } - Success or error message
app.post("/sendMessage", async (req, res) => {
  try {
    const { senderid, receiverid, message } = req.body;
    if (!message || message.trim() === "") return res.json({ message: "Message cannot be empty" });  // Validate message
    // Insert message into database
    await pool.query("INSERT INTO messages (senderid, receiverid, message) VALUES ($1, $2, $3)", [senderid, receiverid, message]);
    res.json({ message: "Message sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

// POST /getMessages - Retrieve messages between two users
// Fetches the chat history for a conversation between the current user and another user.
// Request body: { userId: number, otherUserId: number }
// Response: { messages: array } - Array of message objects with id, senderid, receiverid, message, timestamp
app.post("/getMessages", async (req, res) => {
  try {
    const { userId, otherUserId } = req.body;
    // Query for messages where either user is sender/receiver, ordered by timestamp
    const { rows } = await pool.query(
      `SELECT * FROM messages WHERE (senderid=$1 AND receiverid=$2) OR (senderid=$2 AND receiverid=$1) ORDER BY timestamp ASC`,
      [userId, otherUserId]
    );
    res.json({ messages: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

// Server startup
// Start the Express server on the specified port, defaulting to 3000 if not set in environment.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));

});
