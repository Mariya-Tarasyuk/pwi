const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');

mongoose.connect('mongodb://localhost:27017/chatDB')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define schemas and models
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});
const User = mongoose.model('User', userSchema);

const messageSchema = new mongoose.Schema({
  chatId: String,
  sender: String,
  content: String,
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: 'sent' },
});
const Message = mongoose.model('Message', messageSchema);

const chatSchema = new mongoose.Schema({
  name: String,
  members: [String],
  createdBy: String,
});
const Chat = mongoose.model('Chat', chatSchema);

module.exports = { User, Message, Chat };

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost',
  'http://localhost:3000',
  'http://myproject.local',
  'http://myproject.local:8080',
  'http://192.168.0.29:3000'
];

const io = require('socket.io')(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

const authenticateToken = (req, res, next) => {
  // Якщо хочете дозволити всім, просто пропускайте:
  next();
};

// Sync user with MongoDB
app.post('/api/sync-user', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ success: false, error: 'No username' });

  // Генеруємо JWT для цього користувача
  const token = jwt.sign({ username }, 'your-secret-key', { expiresIn: '1h' });
  res.json({ success: true, token });
});

// Login route
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  User.findOne({ username }).then(user => {
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ username }, 'your-secret-key', { expiresIn: '1h' });
      res.json({ success: true, token });
    } else {
      res.json({ success: false, error: 'Invalid credentials' });
    }
  });
});

// Create chat route
app.post('/api/chats', authenticateToken, (req, res) => {
  const { name, members, createdBy } = req.body;
  const chat = new Chat({ name, members, createdBy }); // createdBy з body
  chat.save().then(() => res.json({ success: true, chatId: chat._id }));
});

// Add member to chat
app.put('/api/chats/:chatId/members', authenticateToken, (req, res) => {
  const { member } = req.body;
  Chat.findByIdAndUpdate(req.params.chatId, { $push: { members: member } }, { new: true })
    .then(chat => res.json({ success: true, chat }))
    .catch(err => res.json({ success: false, error: err.message }));
});

// Save message
app.post('/api/messages', authenticateToken, (req, res) => {
  const { chatId, content } = req.body;
  const message = new Message({ chatId, sender: req.user.username, content });
  message.save().then(() => res.json({ success: true }));
});

// Serve messages page
app.get('/messages', authenticateToken, (req, res) => {
  res.sendFile(__dirname + '/messages.html');
});

// Get chats for user
app.get('/api/chats', async (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(401).json({ success: false, error: 'No username' });
  const chats = await Chat.find({ members: username });
  res.json({ success: true, chats });
});

// Get messages for a chat
app.get('/api/messages', authenticateToken, async (req, res) => {
  const { chatId } = req.query;
  if (!chatId) return res.status(400).json({ success: false, error: 'No chatId' });
  const messages = await Message.find({ chatId });
  res.json({ success: true, messages });
});

io.use((socket, next) => {
  // Брати username з query (НЕ з токена)
  const username = socket.handshake.query?.username;
  if (!username) {
    console.log('No username in socket handshake');
    return next(new Error('Authentication error'));
  }
  socket.user = { username };
  next();
});

io.on('connection', (socket) => {
  console.log('Client connected with user:', socket.user.username);
  
  socket.on('sendMessage', (data) => {
    const { chatId, content } = data;
    const message = new Message({ 

      chatId, 
      sender: socket.user.username, // Використовуємо ім'я з токена
      content,
      timestamp: new Date()
    });
    
    message.save().then(() => {
      io.to(chatId).emit('message', message);
      
      // Надсилаємо сповіщення тільки учасникам інших чатів
      Chat.find({ 
        members: socket.user.username, 
        _id: { $ne: chatId } 
      })
      .then(chats => {
        chats.forEach(chat => {
          io.to(chat._id).emit('notification', {
            chatId,
            sender: socket.user.username
          });
        });
      });
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.user.username);
  });
});

server.listen(3000, '0.0.0.0', () => console.log('Server running on port 3000'));

