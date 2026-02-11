
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(express.json()); 
app.use(cors());

const db = new sqlite3.Database("users.db");


const sql = fs.readFileSync("DataBase.sql").toString();

db.exec(sql, (err) => {
  if (err) console.log("Database error:", err);
  else console.log("Sqlite page running succsesfully");
});

app.post('/register', async (req, res) => {
  const { email, password} = req.body;

  const theme=0;
  const hashedPassword = await bcrypt.hash(password, 10);

 
  db.run(
    "INSERT INTO users (email, password,theme) VALUES (?, ?, ?)",
    [email, hashedPassword,theme],
    function(err) {
      if (err) {
        return res.json({ message: "User already exists or error!" });
      }
      res.json({ message: "User registered successfully!" });
    }
  );
});


app.post("/login", (req, res) => {
  const { email, password} = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (!user) return res.json({ message: "User not found!" });

    const isMatch = bcrypt.compareSync(password, user.password);
    if (isMatch) {
      res.json({ message: "Login successful!",
                 user:{
                      id:   user.id,
                     email: user.email,
                     theme: user.theme
                      }

       });
    } else { 
      res.json({ message: "Incorrect password!" });
    }
  });
});

app.post("/retreiveConnectionsData", (req, res) => {
  const userId = Number(req.body.userId); 

  
  db.all(
    "SELECT userId, userId2 FROM connections WHERE userId = ? OR userId2 = ?",
    [userId, userId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Database error" });

      const connectionsIds = rows.map(row => (row.userId === userId ? row.userId2 : row.userId));

      if (connectionsIds.length === 0) {
       
        db.all(
          "SELECT requests.senderId, users.email FROM requests JOIN users ON requests.senderId = users.id WHERE receiverId = ?",
          [userId],
          (err, requests) => {
            if (err) return res.status(500).json({ message: "Database error" });
            return res.json({ Connections: [], Ids: [], Requests: requests });
          }
        );
        return;
      }

      
      const placeholders = connectionsIds.map(() => "?").join(",");
      db.all(`SELECT * FROM users WHERE id IN (${placeholders})`, connectionsIds, (err, connections) => {
        if (err) return res.status(500).json({ message: "Database error" });

        
        db.all(
          "SELECT requests.senderId, users.email FROM requests JOIN users ON requests.senderId = users.id WHERE receiverId = ?",
          [userId],
          (err, requests) => {
            if (err) return res.status(500).json({ message: "Database error" });

            res.json({
              Connections: connections,
              Ids: connectionsIds,
              Requests: requests
            });
          }
        );
      });
    }
  );
});

  
app.post("/sendConnctionRequest", (req, res) => {
  let { senderId, receiverId } = req.body;

  
  senderId = Number(senderId);
  receiverId = Number(receiverId);

  if (senderId === receiverId) {
    return res.json({ message: "You can't add yourself as a friend" });
  }


  db.get(
    `SELECT userId, userId2 
     FROM connections 
     WHERE (userId = ? AND userId2 = ?) OR (userId = ? AND userId2 = ?)`,
    [senderId, receiverId, receiverId, senderId],
    (err, connection) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (connection) return res.json({ message: "This person is already your friend" });

  
      db.get(
        "SELECT senderId, receiverId FROM requests WHERE senderId = ? AND receiverId = ?",
        [senderId, receiverId],
        (err, existingRequest) => {
          if (err) return res.status(500).json({ message: "Database error" });
          if (existingRequest) return res.json({ message: "You already sent this person a request" });

         
          db.run(
            "INSERT INTO requests(senderId, receiverId) VALUES(?, ?)",
            [senderId, receiverId],
            function(err) {
              if (err) return res.status(500).json({ message: "Error sending connection request" });
              res.json({ message: "Connection request sent successfully" });
            }
          );
        }
      );
    }
  );
});


app.post("/acceptRequest", (req, res) => {
  const { userId, senderId } = req.body;
  
  db.get(
    "SELECT * FROM requests WHERE senderId=? AND receiverId=?",
    [senderId, userId],
    (err, request) => {
      if (err) return res.status(500).json({ message: "Database error" });

      if (!request) {
        return res.json({ message: "No such friend request found" });
      }

      
      const user1 = Math.min(userId, senderId); 
      const user2 = Math.max(userId, senderId);

      db.run(
        "INSERT INTO connections(userId, userId2) VALUES(?, ?)",
        [user1, user2],
        function (err) {
          if (err) return res.status(500).json({ message: "Error adding friend" });

          
          db.run(
            "DELETE FROM requests WHERE senderId=? AND receiverId=?",
            [senderId, userId],
            function (err) {
              if (err) return res.status(500).json({ message: "Error deleting request" });

              res.json({ message: "Friend request accepted successfully" });
            }
          );
        }
      );
    }
  );
});




app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
