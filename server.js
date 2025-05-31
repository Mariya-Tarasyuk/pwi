const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

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
const io = socketIo(server);

app.use(express.json());

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, 'your-secret-key', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Sync user with MongoDB
app.post('/api/sync-user', async (req, res) => {
  const { username } = req.body; // Пароль не передаємо, оскільки він хешований у PHP
  try {
    let user = await User.findOne({ username });
    if (!user) {
      // Додаємо користувача без пароля, оскільки він уже хешований у MySQL
      user = new User({ username });
      await user.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
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
  const { name, members } = req.body;
  const chat = new Chat({ name, members, createdBy: req.user.username });
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

// Socket.IO for real-time messaging
io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('joinChat', (chatId) => socket.join(chatId));
  socket.on('sendMessage', (data) => {
    const { chatId, content } = data;
    const message = new Message({ chatId, sender: socket.user.username, content });
    message.save().then(() => {
      io.to(chatId).emit('message', message);
      Chat.find({ members: socket.user.username, _id: { $ne: chatId } })
        .then(chats => {
          chats.forEach(chat => io.to(chat._id).emit('notification', { chatId, sender: socket.user.username }));
        });
    });
  });
  socket.on('setStatus', (status) => {
    socket.broadcast.emit('userStatus', { username: socket.user.username, status });
  });
  socket.on('disconnect', () => console.log('Client disconnected'));
});

server.listen(3000, () => console.log('Server running on port 3000'));