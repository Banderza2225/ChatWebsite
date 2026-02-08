
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

app.post("/retreiveConnections&RequestsData", (req, res) => {
  const { userId} = req.body;
  

  db.all("SELECT userId, userId2 FROM connections WHERE userId = ? OR userId2 =? ", [userId,userId], (err, rows) => {
    
   if (err) return res.status(500).json({ message: "Database error" });

   const connectionsIds= rows.map(row=> row.userId===userId? row.userId2:row.userId);
   
  const placeholders = connectionsIds.map(() => "?").join(",");

                if(connectionsIds.length===0){return res.json({ Connections:[],Ids:[]})}

    
       db.all(`SELECT * FROM users WHERE id IN (${placeholders})`,connectionsIds,(err,connections) =>{

            
        db.all("SELECT senderId FROM requests WHERE receiverId= ?",[userId],(err,requests)=>{

     

            res.json({ 
                Connections:connections,
                Ids: connectionsIds,
                Requests:requests

                       });
         });
       });
    });
});
  
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
