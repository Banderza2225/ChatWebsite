-- Create the users table if it does not already exist
-- This table stores user information including id, email, password, and theme preference
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Auto-incrementing primary key for unique user ID
    email TEXT UNIQUE,  -- Unique email address for each user
    password TEXT,  -- Hashed password for security
    theme INTEGER  -- Theme preference (e.g., 0 for default)
);

-- Create the requests table for handling friend requests
-- This table stores pending connection requests between users
CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Auto-incrementing primary key
    senderId INTEGER NOT NULL,  -- ID of the user sending the request
    receiverId INTEGER NOT NULL,  -- ID of the user receiving the request
    UNIQUE(senderId, receiverId),  -- Ensure no duplicate requests between the same pair
    FOREIGN KEY(senderId) REFERENCES users(id),  -- Foreign key to users table
    FOREIGN KEY(receiverId) REFERENCES users(id)  -- Foreign key to users table
);

-- Create the connections table for established friendships
-- This table stores bidirectional connections between users
CREATE TABLE IF NOT EXISTS connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Auto-incrementing primary key
    userId INTEGER NOT NULL,  -- First user in the connection
    userId2 INTEGER NOT NULL,  -- Second user in the connection
    UNIQUE(userId, userId2),  -- Ensure no duplicate connections
    CHECK(userId < userId2),  -- Ensure userId is always less than userId2 for consistency
    FOREIGN KEY(userId) REFERENCES users(id),  -- Foreign key to users table
    FOREIGN KEY(userId2) REFERENCES users(id)  -- Foreign key to users table
);

-- Create the messages table for storing chat messages
-- This table holds messages exchanged between users
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Auto-incrementing primary key
    senderId INTEGER NOT NULL,  -- ID of the message sender
    receiverId INTEGER NOT NULL,  -- ID of the message receiver
    message TEXT,  -- The text content of the message
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,  -- Timestamp when the message was sent
    FOREIGN KEY(senderId) REFERENCES users(id),  -- Foreign key to users table
    FOREIGN KEY(receiverId) REFERENCES users(id)  -- Foreign key to users table
);
