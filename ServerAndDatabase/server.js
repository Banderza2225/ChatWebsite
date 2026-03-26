const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());


const pool = new Pool({
  connectionString: "postgresql://chat_db_my0l_user:tInGm05gp4dv5uP2gECoCyNQGcQHSLtM@dpg-d72gub8gjchc73847uq0-a/chat_db_my0l"
});


const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      theme INT DEFAULT 0
    );
    
    CREATE TABLE IF NOT EXISTS connections (
      userId INT NOT NULL,
      userId2 INT NOT NULL,
      PRIMARY KEY(userId, userId2)
    );
    
    CREATE TABLE IF NOT EXISTS requests (
      senderId INT NOT NULL,
      receiverId INT NOT NULL,
      PRIMARY KEY(senderId, receiverId)
    );
    
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      senderId INT NOT NULL,
      receiverId INT NOT NULL,
      message TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("Database initialized");
};

initDB().catch(err => console.error("DB init error:", err));



app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const theme = 0;
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (email, password, theme) VALUES ($1, $2, $3)",
      [email, hashedPassword, theme]
    );

    res.json({ message: "User registered successfully!" });
  } catch (err) {
    res.json({ message: "User already exists or error!" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = rows[0];

    if (!user) return res.json({ message: "User not found!" });

    const isMatch = bcrypt.compareSync(password, user.password);
    if (isMatch) {
      res.json({
        message: "Login successful!",
        user: { id: user.id, email: user.email, theme: user.theme }
      });
    } else {
      res.json({ message: "Incorrect password!" });
    }
  } catch (err) {
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/retreiveConnectionsData", async (req, res) => {
  try {
    const userId = Number(req.body.userId);

    const { rows } = await pool.query(
      "SELECT userId, userId2 FROM connections WHERE userId = $1 OR userId2 = $1",
      [userId]
    );

    const connectionsIds = rows.map(row => (row.userid === userId ? row.userid2 : row.userid));

    let connections = [];
    if (connectionsIds.length > 0) {
      const placeholders = connectionsIds.map((_, i) => `$${i + 1}`).join(",");
      const { rows: connRows } = await pool.query(
        `SELECT * FROM users WHERE id IN (${placeholders})`,
        connectionsIds
      );
      connections = connRows;
    }

    const { rows: requests } = await pool.query(
      "SELECT requests.senderid, users.email FROM requests JOIN users ON requests.senderid = users.id WHERE receiverid = $1",
      [userId]
    );

    res.json({ Connections: connections, Ids: connectionsIds, Requests: requests });
  } catch (err) {
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/sendConnctionRequest", async (req, res) => {
  try {
    let { senderId, receiverId } = req.body;
    senderId = Number(senderId);
    receiverId = Number(receiverId);

    if (senderId === receiverId) return res.json({ message: "You can't add yourself as a friend" });

    const { rows: existingConnection } = await pool.query(
      "SELECT userId, userId2 FROM connections WHERE (userId=$1 AND userId2=$2) OR (userId=$2 AND userId2=$1)",
      [senderId, receiverId]
    );
    if (existingConnection.length > 0) return res.json({ message: "This person is already your friend" });

    const { rows: existingRequest } = await pool.query(
      "SELECT senderId, receiverId FROM requests WHERE senderId=$1 AND receiverId=$2",
      [senderId, receiverId]
    );
    if (existingRequest.length > 0) return res.json({ message: "You already sent this person a request" });

    await pool.query(
      "INSERT INTO requests (senderId, receiverId) VALUES ($1, $2)",
      [senderId, receiverId]
    );

    res.json({ message: "Connection request sent successfully" });
  } catch (err) {
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/acceptRequest", async (req, res) => {
  try {
    const { userId, senderId } = req.body;
    const { rows: requestRows } = await pool.query(
      "SELECT * FROM requests WHERE senderId=$1 AND receiverId=$2",
      [senderId, userId]
    );
    if (requestRows.length === 0) return res.json({ message: "No such friend request found" });

    const user1 = Math.min(userId, senderId);
    const user2 = Math.max(userId, senderId);

    await pool.query("INSERT INTO connections(userId, userId2) VALUES ($1, $2)", [user1, user2]);
    await pool.query("DELETE FROM requests WHERE senderId=$1 AND receiverId=$2", [senderId, userId]);

    res.json({ message: "Friend request accepted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/sendMessage", async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;
    if (!message || message.trim() === "") return res.json({ message: "Message cannot be empty" });

    await pool.query(
      "INSERT INTO messages (senderId, receiverId, message) VALUES ($1, $2, $3)",
      [senderId, receiverId, message]
    );

    res.json({ message: "Message sent successfully" });
  } catch (err) {
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/getMessages", async (req, res) => {
  try {
    const { userId, otherUserId } = req.body;
    const { rows } = await pool.query(
      `SELECT * FROM messages 
       WHERE (senderId=$1 AND receiverId=$2) 
          OR (senderId=$2 AND receiverId=$1) 
       ORDER BY timestamp ASC`,
      [userId, otherUserId]
    );
    res.json({ messages: rows });
  } catch (err) {
    res.status(500).json({ message: "Database error" });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
