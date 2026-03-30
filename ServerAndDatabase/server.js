// express: Web framework for building APIs and handling HTTP requests.
const express = require("express");

// pg: PostgreSQL client for Node.js.
const { Pool } = require("pg");

// bcryptjs: Library for hashing passwords securely.
const bcrypt = require("bcryptjs");

// cors: Middleware for enabling Cross-Origin Resource Sharing.
const cors = require("cors");

// Create an instance of the Express application
// This is the main application object that will handle routing, middleware, and server setup.
const app = express();

// Middleware to parse incoming JSON payloads in request bodies
// This allows the server to automatically parse JSON data sent in POST requests.
app.use(express.json());

// Middleware to enable CORS for all routes
// This permits cross-origin requests, which is necessary for the frontend to communicate with this backend.
app.use(cors());

// Create a connection pool to the PostgreSQL database
// Uses the DATABASE_URL environment variable for connection string, typical in production deployments.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Asynchronous function to initialize the database
// Creates tables if they don't exist, ensuring the schema is set up on server start.
const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      theme INT DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS connections (
      userid INT NOT NULL,
      userid2 INT NOT NULL,
      PRIMARY KEY(userid, userid2)
    );

    CREATE TABLE IF NOT EXISTS requests (
      senderid INT NOT NULL,
      receiverid INT NOT NULL,
      PRIMARY KEY(senderid, receiverid)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      senderid INT NOT NULL,
      receiverid INT NOT NULL,
      message TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("Database initialized");
};

// Initialize the database and handle any errors
initDB().catch(err => console.error("DB init error:", err));

// Define the POST route for user registration
// This endpoint handles new user sign-ups by hashing the password and storing user data.
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

// Define the POST route for user login
// This endpoint verifies user credentials and returns user data on successful login.
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

// Define the POST route to retrieve connections and requests data for a user
// This endpoint fetches the user's friends (connections) and pending friend requests.
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

// Define the POST route to send a connection request
// This allows users to send friend requests to other users.
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

// Define the POST route to accept a friend request
// This establishes a connection between users and removes the request.
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

// Define the POST route to send a message
// This stores a new message in the database.
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

// Define the POST route to retrieve messages between two users
// This fetches the chat history for a conversation.
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

// Start the server on the specified port
// PORT is taken from environment variable or defaults to 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));