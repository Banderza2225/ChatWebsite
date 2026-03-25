
const express = require("express");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const theme = 0;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      "INSERT INTO users (email, password, theme) VALUES ($1, $2, $3)",
      [email, hashedPassword, theme]
    );
    res.json({ message: "User registered successfully!" });
  } catch {
    res.json({ message: "User already exists or error!" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  const user = result.rows[0];

  if (!user) return res.json({ message: "User not found!" });

  const isMatch = bcrypt.compareSync(password, user.password);

  if (isMatch) {
    res.json({
      message: "Login successful!",
      user: {
        id: user.id,
        email: user.email,
        theme: user.theme
      }
    });
  } else {
    res.json({ message: "Incorrect password!" });
  }
});

app.post("/retreiveConnectionsData", async (req, res) => {
  const userId = Number(req.body.userId);

  try {
    const connRes = await pool.query(
      "SELECT userId, userId2 FROM connections WHERE userId = $1 OR userId2 = $1",
      [userId]
    );

    const connectionsIds = connRes.rows.map(row =>
      row.userid === userId ? row.userid2 : row.userid
    );

    const reqRes = await pool.query(
      "SELECT requests.senderId, users.email FROM requests JOIN users ON requests.senderId = users.id WHERE receiverId = $1",
      [userId]
    );

    if (connectionsIds.length === 0) {
      return res.json({ Connections: [], Ids: [], Requests: reqRes.rows });
    }

    const usersRes = await pool.query(
      `SELECT * FROM users WHERE id = ANY($1)`,
      [connectionsIds]
    );

    res.json({
      Connections: usersRes.rows,
      Ids: connectionsIds,
      Requests: reqRes.rows
    });

  } catch {
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/sendConnctionRequest", async (req, res) => {
  let { senderId, receiverId } = req.body;
  senderId = Number(senderId);
  receiverId = Number(receiverId);

  if (senderId === receiverId) {
    return res.json({ message: "You can't add yourself as a friend" });
  }

  try {
    const existingConn = await pool.query(
      `SELECT * FROM connections WHERE (userId=$1 AND userId2=$2) OR (userId=$2 AND userId2=$1)`,
      [senderId, receiverId]
    );

    if (existingConn.rows.length > 0) {
      return res.json({ message: "This person is already your friend" });
    }

    const existingReq = await pool.query(
      "SELECT * FROM requests WHERE senderId=$1 AND receiverId=$2",
      [senderId, receiverId]
    );

    if (existingReq.rows.length > 0) {
      return res.json({ message: "You already sent this person a request" });
    }

    await pool.query(
      "INSERT INTO requests(senderId, receiverId) VALUES($1, $2)",
      [senderId, receiverId]
    );

    res.json({ message: "Connection request sent successfully" });

  } catch {
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/acceptRequest", async (req, res) => {
  const { userId, senderId } = req.body;

  try {
    const request = await pool.query(
      "SELECT * FROM requests WHERE senderId=$1 AND receiverId=$2",
      [senderId, userId]
    );

    if (request.rows.length === 0) {
      return res.json({ message: "No such friend request found" });
    }

    const user1 = Math.min(userId, senderId);
    const user2 = Math.max(userId, senderId);

    await pool.query(
      "INSERT INTO connections(userId, userId2) VALUES($1, $2)",
      [user1, user2]
    );

    await pool.query(
      "DELETE FROM requests WHERE senderId=$1 AND receiverId=$2",
      [senderId, userId]
    );

    res.json({ message: "Friend request accepted successfully" });

  } catch {
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/sendMessage", async (req, res) => {
  const { senderId, receiverId, message } = req.body;

  if (!message || message.trim() === "") {
    return res.json({ message: "Message cannot be empty" });
  }

  try {
    await pool.query(
      "INSERT INTO messages (senderId, receiverId, message) VALUES ($1, $2, $3)",
      [senderId, receiverId, message]
    );

    res.json({ message: "Message sent successfully" });
  } catch {
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/getMessages", async (req, res) => {
  const { userId, otherUserId } = req.body;

  try {
    const result = await pool.query(
      `SELECT * FROM messages 
       WHERE (senderId=$1 AND receiverId=$2)
          OR (senderId=$2 AND receiverId=$1)
       ORDER BY timestamp ASC`,
      [userId, otherUserId]
    );

    res.json({ messages: result.rows });
  } catch {
    res.status(500).json({ message: "Database error" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});