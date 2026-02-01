
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const cors = require("cors");

const app = express();
app.use(express.json()); 
app.use(cors());

const db = new sqlite3.Database('users.db');


db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
  )
`);


app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  
  const hashedPassword = await bcrypt.hash(password, 10);

 
  db.run(
    'INSERT INTO users (email, password) VALUES (?, ?)',
    [email, hashedPassword],
    function(err) {
      if (err) {
        return res.json({ message: 'User already exists or error!' });
      }
      res.json({ message: 'User registered successfully!' });
    }
  );
});


app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (!user) return res.json({ message: 'User not found!' });

    const isMatch = bcrypt.compareSync(password, user.password);
    if (isMatch) {
      res.json({ message: 'Login successful!' });
    } else {
      res.json({ message: 'Incorrect password!' });
    }
  });
});


app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
