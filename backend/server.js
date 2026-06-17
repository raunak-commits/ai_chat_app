const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { initDB } = require('./db');
const authRoutes = require('./auth');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Init database tables
initDB();

// Auth routes
app.use('/auth', authRoutes);

// Middleware to protect routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

app.get('/health', (req, res) => {
  res.json({ status: 'Server is running!' });
});

// Protected chat route
app.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { messages } = req.body;

    const formattedMessages = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: formattedMessages
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("API Error:", data);
      return res.status(response.status).json({ error: 'Groq API Error' });
    }

    const reply = data.choices[0].message.content;
    res.json({ reply });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: 'Something went wrong on the server' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Get all chats for a user
app.get('/chats', authenticateToken, async (req, res) => {
  try {
    const { pool } = require('./db');
    const result = await pool.query(
      'SELECT * FROM chats WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json({ chats: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages for a chat
app.get('/chats/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { pool } = require('./db');
    const result = await pool.query(
      'SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC',
      [req.params.chatId]
    );
    res.json({ messages: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new chat
app.post('/chats', authenticateToken, async (req, res) => {
  try {
    const { pool } = require('./db');
    const { title } = req.body;
    const result = await pool.query(
      'INSERT INTO chats (user_id, title) VALUES ($1, $2) RETURNING *',
      [req.userId, title || 'New Chat']
    );
    res.json({ chat: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update chat title
app.patch('/chats/:chatId', authenticateToken, async (req, res) => {
  try {
    const { pool } = require('./db');
    const { title } = req.body;
    await pool.query(
      'UPDATE chats SET title = $1 WHERE id = $2 AND user_id = $3',
      [title, req.params.chatId, req.userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a chat
app.delete('/chats/:chatId', authenticateToken, async (req, res) => {
  try {
    const { pool } = require('./db');
    await pool.query(
      'DELETE FROM chats WHERE id = $1 AND user_id = $2',
      [req.params.chatId, req.userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save a message
app.post('/chats/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { pool } = require('./db');
    const { sender, text } = req.body;
    const result = await pool.query(
      'INSERT INTO messages (chat_id, sender, text) VALUES ($1, $2, $3) RETURNING *',
      [req.params.chatId, sender, text]
    );
    res.json({ message: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});