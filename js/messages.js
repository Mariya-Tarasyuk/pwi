document.addEventListener('DOMContentLoaded', async () => {
    console.log("messages.js loaded");
    let socketInitialized = false;
    if (socketInitialized) {
        console.log("Socket already initialized, skipping...");
        return;
    }
    socketInitialized = true;

    let username = null;
    let token = null;
    try {
        const res = await fetch('/api/auth.php?action=check', { credentials: 'include' });
        const data = await res.json();
        if (data.success && data.username) {
            username = data.username;
            token = data.token; // Assumes API returns token
            console.log('Authenticated user:', username, 'Token:', token);
        } else {
            alert("Ви не авторизовані. Будь ласка, увійдіть у систему.");
            window.location.href = '/html/login.html';
            return;
        }
    } catch (e) {
        console.error('Auth error:', e);
        alert("Помилка авторизації.");
        window.location.href = '/html/login.html';
        return;
    }

    if (!username) {
        console.warn('No username retrieved');
        alert("Не вдалося отримати ім'я користувача. Перезавантажте сторінку або увійдіть знову.");
        window.location.href = '/html/login.html';
        return;
    }

    const socketUrl = `${window.location.protocol}//${window.location.hostname}:3000`;
    let socket = io(socketUrl, { query: { username } });

    const chatList = document.getElementById('chatList');
    chatList.innerHTML = '';

    const membersList = document.getElementById('membersList');
    const messageHistory = document.getElementById('messageHistory');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const newChatBtn = document.getElementById('newChatBtn');
    const addMemberBtn = document.getElementById('addMemberBtn');
    const notificationBell = document.getElementById('notificationBell');
    const notificationIndicator = document.getElementById('notificationIndicator');

    let currentChatId = null;

    function getChatIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('chatId');
    }

    // Initialize chat from URL
    const initialChatId = getChatIdFromUrl();
    if (initialChatId) {
        currentChatId = initialChatId;
        console.log('Initial chatId from URL:', currentChatId);
        joinChat(currentChatId); // Load chat
    } else {
        console.log('No chatId in URL, waiting for chat selection');
        messageHistory.innerHTML = '<p>Select a chat to start messaging</p>';
    }

    function joinChat(chatId) {
        console.log('Joining chat:', chatId);
        if (!chatId) {
            console.error('chatId is undefined in joinChat');
            messageHistory.innerHTML = '<p>Error: No chat selected</p>';
            return;
        }
        messageHistory.innerHTML = '';
        currentChatId = chatId;

        // Fetch messages
        console.log('Token before fetch:', token);
        console.log('Fetching messages for chatId:', chatId);
        fetch(`${window.location.protocol}//${window.location.hostname}:3000/api/messages?chatId=${chatId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                console.log('Fetched messages:', data);
                if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
                    messageHistory.innerHTML = '';
                    data.messages.forEach(msg => {
                        messageHistory.innerHTML += `
                            <p><strong>${msg.sender}</strong>: ${msg.content} 
                            (${new Date(msg.timestamp).toISOString().slice(11, 16)})</p>
                        `;
                    });
                    messageHistory.scrollTop = messageHistory.scrollHeight;
                } else {
                    console.warn('No messages or failed to load:', data.error || 'No data');
                    messageHistory.innerHTML = '<p>No messages yet</p>';
                }
            })
            .catch(err => {
                console.error('Error fetching messages:', err);
                messageHistory.innerHTML = '<p>Error loading messages</p>';
            });

        // Fetch chat members
        fetch(`${window.location.protocol}//${window.location.hostname}:3000/api/chats?username=${encodeURIComponent(username)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.chats)) {
                    const chat = data.chats.find(c => c._id === chatId);
                    membersList.innerHTML = '';
                    if (chat && Array.isArray(chat.members)) {
                        chat.members.forEach(member => {
                            membersList.innerHTML += `<div>${member}</div>`;
                        });
                    }
                }
            });

        socket.emit('joinChat', chatId);
    }

    socket.on('message', (msg) => {
        console.log('Received message:', msg);
        console.log('Current chatId:', currentChatId);
        if (msg.chatId === currentChatId) {
            const existingMessages = messageHistory.getElementsByTagName('p');
            const isDuplicate = Array.from(existingMessages).some(p => 
                p.textContent.includes(msg.content) && p.textContent.includes(msg.sender)
            );
            if (!isDuplicate) {
                messageHistory.innerHTML += `<p><strong>${msg.sender}</strong>: ${msg.content} (${new Date(msg.timestamp).toISOString().slice(11, 16)})</p>`;
                messageHistory.scrollTop = messageHistory.scrollHeight;
            }
        } else {
            notificationIndicator.classList.add('show');
            notificationBell.classList.add('bell-animation');
        }
    });

    socket.on('notification', (data) => {
        console.log('Received notification:', data);
        if (currentChatId !== data.chatId) {
            notificationIndicator.classList.add('show');
            notificationBell.classList.add('bell-animation');
            notificationBell.onclick = () => {
                joinChat(data.chatId);
                notificationIndicator.classList.remove('show');
                notificationBell.classList.remove('bell-animation');
            };
        }
    });

    notificationBell.onclick = (e) => {
        e.stopPropagation();
        notificationIndicator.classList.remove('show');
        notificationBell.classList.remove('bell-animation');
    };

    // Fetch and display chat list
    fetch(`${window.location.protocol}//${window.location.hostname}:3000/api/chats?username=${encodeURIComponent(username)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(response => response.json())
        .then(data => {
            console.log("Fetched chats", data);
            if (data.success && Array.isArray(data.chats)) {
                data.chats.forEach(chat => {
                    const div = document.createElement('div');
                    div.className = `p-2 border rounded ${chat.members.includes(username) ? 'bg-purple-200' : ''} ${chat.createdBy === username ? 'font-bold' : ''}`;
                    div.textContent = chat.name || chat.members.join(', ');
                    div.onclick = () => {
                        currentChatId = chat._id;
                        joinChat(chat._id);
                    };
                    chatList.appendChild(div);
                });
                if (data.chats.length === 0) {
                    chatList.innerHTML = '<p>No chats available</p>';
                }
            }
        });

    sendMessageBtn.onclick = () => {
        const content = messageInput.value.trim();
        console.log('Sending message - chatId:', currentChatId, 'content:', content);
        if (content && currentChatId) {
            socket.emit('sendMessage', { chatId: currentChatId, content });
            messageInput.value = '';
        } else {
            console.warn('Cannot send message: chatId or content is missing');
            if (!currentChatId) {
                alert('Please select a chat first by clicking on a chat from the list.');
            }
        }
    };

console.log('Current chatId before sending:', currentChatId);
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
        // ... решта коду ...
    } catch (err) {
        console.error('Error saving message:', err);
    }
});

    const userSelectModal = document.getElementById('userSelectModal');
    const userList = document.getElementById('userList');
    const createChatBtn = document.getElementById('createChatBtn');
    const closeUserModal = document.getElementById('closeUserModal');

    newChatBtn.onclick = async () => {
        const res = await fetch('/api/users.php');
        const data = await res.json();
        userList.innerHTML = '';
        if (data.success && Array.isArray(data.users)) {
            data.users.forEach(u => {
                if (u.username !== username) { 
                    userList.innerHTML += `<label class="block"><input type="checkbox" value="${u.username}"> ${u.username}</label>`;
                }
            });
        }
        userSelectModal.classList.remove('hidden');
    };

    closeUserModal.onclick = () => userSelectModal.classList.add('hidden');

    createChatBtn.onclick = () => {
        const checked = Array.from(userList.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
        if (checked.length === 0) return alert('Select at least one user');
        fetch(`${window.location.protocol}//${window.location.hostname}:3000/api/chats`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: `Chat with ${[username, ...checked].join(', ')}`,
                members: [username, ...checked],
                createdBy: username
            })
        }).then(res => res.json()).then(data => {
            if (data.success) {
                userSelectModal.classList.add('hidden');
                currentChatId = data.chatId;
                joinChat(data.chatId);
            }
        });
    };

    addMemberBtn.onclick = () => {
        const member = prompt('Enter username to add');
        if (member && currentChatId) {
            fetch(`${window.location.protocol}//${window.location.hostname}:3000/api/chats/${currentChatId}/members`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ member })
            }).then(res => res.json()).then(data => {
                if (data.success) membersList.innerHTML += `<div>${member}</div>`;
            });
        }
    };

    socket.emit('setStatus', 'online');

    document.addEventListener('click', (e) => {
        if (notificationBell && !notificationBell.contains(e.target)) {
            notificationIndicator.classList.remove('show');
            notificationBell.classList.remove('bell-animation');
        }
    });
});