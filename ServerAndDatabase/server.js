const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
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

initDB().catch(err => console.error("DB init error:", err));

app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (email, password, theme) VALUES ($1, $2, 0)",
      [email, hashedPassword]
    );
    res.json({ message: "User registered successfully!" });
  } catch {
    res.json({ message: "User already exists or error!" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    const user = rows[0];
    if (!user) return res.json({ message: "User not found!" });
    const isMatch = bcrypt.compareSync(password, user.password);
    if (isMatch) {
      res.json({ message: "Login successful!", user: { id: user.id, email: user.email, theme: user.theme } });
    } else res.json({ message: "Incorrect password!" });
  } catch {
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/retreiveConnectionsData", async (req, res) => {
  try {
    const userId = Number(req.body.userId);
    const { rows: connectionsRows } = await pool.query(
      "SELECT userid, userid2 FROM connections WHERE userid=$1 OR userid2=$1",
      [userId]
    );
    const connectionsIds = connectionsRows.map(r => (r.userid === userId ? r.userid2 : r.userid));
    let connections = [];
    if (connectionsIds.length > 0) {
      const placeholders = connectionsIds.map((_, i) => `$${i+1}`).join(",");
      const { rows } = await pool.query(`SELECT * FROM users WHERE id IN (${placeholders})`, connectionsIds);
      connections = rows;
    }
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

app.post("/sendConnctionRequest", async (req, res) => {
  try {
    let { senderid, receiverid } = req.body;
    senderid = Number(senderid);
    receiverid = Number(receiverid);
    if (senderid === receiverid) return res.json({ message: "You can't add yourself as a friend" });
    const { rows } = await pool.query(
      "SELECT userid, userid2 FROM connections WHERE (userid=$1 AND userid2=$2) OR (userid=$2 AND userid2=$1)",
      [senderid, receiverid]
    );
    if (rows.length > 0) return res.json({ message: "This person is already your friend" });
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

app.post("/acceptRequest", async (req, res) => {
  try {
    const { userId, senderid } = req.body;
    const { rows } = await pool.query("SELECT * FROM requests WHERE senderid=$1 AND receiverid=$2", [senderid, userId]);
    if (rows.length === 0) return res.json({ message: "No such friend request found" });
    const user1 = Math.min(userId, senderid);
    const user2 = Math.max(userId, senderid);
    await pool.query("INSERT INTO connections(userid, userid2) VALUES ($1, $2) ON CONFLICT DO NOTHING", [user1, user2]);
    await pool.query("DELETE FROM requests WHERE senderid=$1 AND receiverid=$2", [senderid, userId]);
    res.json({ message: "Friend request accepted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/sendMessage", async (req, res) => {
  try {
    const { senderid, receiverid, message } = req.body;
    if (!message || message.trim() === "") return res.json({ message: "Message cannot be empty" });
    await pool.query("INSERT INTO messages (senderid, receiverid, message) VALUES ($1, $2, $3)", [senderid, receiverid, message]);
    res.json({ message: "Message sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/getMessages", async (req, res) => {
  try {
    const { userId, otherUserId } = req.body;
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));