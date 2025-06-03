const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');

mongoose.connect('mongodb://localhost:27017/chatDB')
    .then(() => console.log('Connected to MongoDB successfully'))
    .catch(err => console.error('MongoDB connection failed:', err));
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
    'http://192.168.0.29:3000',
    'http://172.20.10.9:3000'
];

const io = require('socket.io')(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

app.use(express.json());

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Received token:', token);
    if (!token) return res.status(401).json({ success: false, error: 'No token provided' });
    jwt.verify(token, 'your-secret-key', (err, user) => {
        if (err) {
            console.log('Token verification failed:', err.message);
            return res.status(403).json({ success: false, error: 'Invalid token' });
        }
        req.user = user;
        console.log('Authenticated user:', user);
        next();
    });
};

// Sync user with MongoDB
app.post('/api/sync-user', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ success: false, error: 'No username' });

    const token = jwt.sign({ username }, 'your-secret-key', { expiresIn: '1h' });
    res.json({ success: true, token });
});

// Login route
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user && bcrypt.compareSync(password, user.password)) {
            const token = jwt.sign({ username }, 'your-secret-key', { expiresIn: '1h' });
            res.json({ success: true, token });
        } else {
            res.json({ success: false, error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Create chat route
app.post('/api/chats', authenticateToken, async (req, res) => {
    const { name, members, createdBy } = req.body;
    try {
        const chat = new Chat({ name, members, createdBy });
        await chat.save();
        res.json({ success: true, chatId: chat._id });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Add member to chat
app.put('/api/chats/:chatId/members', authenticateToken, async (req, res) => {
    const { member } = req.body;
    try {
        const chat = await Chat.findByIdAndUpdate(req.params.chatId, { $push: { members: member } }, { new: true });
        res.json({ success: true, chat });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// Save message
app.post('/api/messages', authenticateToken, async (req, res) => {
    const { chatId, content } = req.body;
    try {
        const message = new Message({ chatId, sender: req.user.username, content });
        await message.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Serve messages page
app.get('/messages', authenticateToken, (req, res) => {
    res.sendFile(__dirname + '/messages.html');
});

// Get chats for user
app.get('/api/chats', async (req, res) => {
    const username = req.query.username;
    if (!username) return res.status(401).json({ success: false, error: 'No username' });
    try {
        const chats = await Chat.find({ members: username });
        res.json({ success: true, chats });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get messages for a chat
app.get('/api/messages', authenticateToken, async (req, res) => {
    const { chatId } = req.query;
    if (!chatId) return res.status(400).json({ success: false, error: 'No chatId' });
    try {
        const messages = await Message.find({ chatId });
        console.log(`Fetched messages for chat ${chatId}:`, messages);
        res.json({ success: true, messages });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

io.use((socket, next) => {
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

    socket.join(socket.user.username);

    socket.on('joinChat', (chatId) => {
        socket.join(chatId);
        console.log(`${socket.user.username} joined chat ${chatId}`);
    });

    socket.on('sendMessage', async (data) => {
    console.log('Received sendMessage:', data);
    const { chatId, content } = data;
    if (!chatId || !content) {
        console.error('Missing chatId or content:', { chatId, content });
        return;
    }
    const message = new Message({ 
        chatId, 
        sender: socket.user.username,
        content,
        timestamp: new Date()
    });
    try {
        const savedMessage = await message.save();
        console.log('Message saved:', savedMessage);
        io.to(chatId).emit('message', savedMessage);
        // ... notify members ...
    } catch (err) {
        console.error('Error saving message:', err);
    }
});
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.user.username);
    });
});

server.listen(3000, '0.0.0.0', () => console.log('Server running on port 3000'));