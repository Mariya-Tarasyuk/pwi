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
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json());

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ success: false, error: 'No token provided' });

    jwt.verify(token, 'your-secret-key', (err, user) => {
        if (err) return res.status(403).json({ success: false, error: 'Invalid token' });
        req.user = user;
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
    const { chatId, content } = data;
    const message = new Message({ 
        chatId, 
        sender: socket.user.username,
        content,
        timestamp: new Date()
    });

    try {
        await message.save();
        console.log(`Sending message to chat ${chatId} from ${socket.user.username}`);
        io.to(chatId).emit('message', message);

        const chat = await Chat.findById(chatId);
        if (chat && chat.members) {
            console.log(`Notifying members: ${chat.members}`);
            chat.members.forEach(member => {
                if (member !== socket.user.username) {
                    io.to(member).emit('notification', {
                        chatId,
                        sender: socket.user.username,
                        chatName: chat.name || chat.members.join(', ')
                    });
                    // Надсилаємо newMessage для сторінки студентів
                    io.to(member).emit('newMessage', {
                        chatId,
                        sender: socket.user.username,
                        chatName: chat.name || chat.members.join(', ')
                    });
                }
            });
        }
    } catch (err) {
        console.error('Error saving message:', err);
    }
});
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.user.username);
    });
});

server.listen(3000, '0.0.0.0', () => console.log('Server running on port 3000'));