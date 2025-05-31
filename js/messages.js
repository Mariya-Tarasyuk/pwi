document.addEventListener('DOMContentLoaded', () => {
  const socket = io('http://localhost:3000');

  // Отримання токена з URL
  const urlParams = new URLSearchParams(window.location.search);
  let token = urlParams.get('token') || localStorage.getItem('token');
  if (token) {
    localStorage.setItem('token', token); // Зберігаємо токен
  } else {
    window.location.href = '/login'; // Якщо токена немає, перенаправляємо на логін
    return;
  }

  const user = JSON.parse(atob(token.split('.')[1])).username;
  const chatList = document.getElementById('chatList');
  const membersList = document.getElementById('membersList');
  const messageHistory = document.getElementById('messageHistory');
  const messageInput = document.getElementById('messageInput');
  const sendMessageBtn = document.getElementById('sendMessageBtn');
  const newChatBtn = document.getElementById('newChatBtn');
  const addMemberBtn = document.getElementById('addMemberBtn');
  const notificationBell = document.getElementById('notificationBell');
  const notificationIndicator = document.getElementById('notificationIndicator');

  let currentChatId = null;
  const headers = { 'Authorization': token };

  // Fetch initial chats
  fetch('http://localhost:3000/api/chats', { headers })
    .then(res => res.json())
    .then(chats => {
      chats.forEach(chat => {
        const div = document.createElement('div');
        div.className = `p-2 border rounded ${chat.members.includes(user) ? 'bg-purple-200' : ''} ${chat.createdBy === user ? 'font-bold' : ''}`;
        div.textContent = chat.name || chat.members.join(', ');
        div.onclick = () => joinChat(chat._id);
        chatList.appendChild(div);
      });
    });

  function joinChat(chatId) {
    currentChatId = chatId;
    socket.emit('joinChat', chatId);
    fetch(`http://localhost:3000/api/messages?chatId=${chatId}`, { headers })
      .then(res => res.json())
      .then(messages => {
        messageHistory.innerHTML = messages.map(m => `<p><strong>${m.sender}</strong>: ${m.content} (${new Date(m.timestamp).toLocaleTimeString()})</p>`).join('');
      });
    notificationIndicator.classList.add('hidden');
  }

  // Send message
  sendMessageBtn.onclick = () => {
    const content = messageInput.value;
    if (content && currentChatId) {
      fetch('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: { 'Authorization': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: currentChatId, content })
      }).then(() => {
        socket.emit('sendMessage', { chatId: currentChatId, content });
        messageInput.value = '';
      });
    }
  };

  // New chat
  newChatBtn.onclick = () => {
    const membersInput = prompt('Enter members (comma-separated)');
    const members = membersInput ? membersInput.split(',').map(m => m.trim()) : [];
    fetch('http://localhost:3000/api/chats', {
      method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `Chat with ${members.join(', ')}`, members: [user, ...members] })
    }).then(res => res.json()).then(data => {
      if (data.success) joinChat(data.chatId);
    });
  };

  // Add member
  addMemberBtn.onclick = () => {
    const member = prompt('Enter username to add');
    if (member && currentChatId) {
      fetch(`http://localhost:3000/api/chats/${currentChatId}/members`, {
        method: 'PUT',
        headers: { 'Authorization': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ member })
      }).then(res => res.json()).then(data => {
        if (data.success) membersList.innerHTML += `<div>${member}</div>`;
      });
    }
  };

  socket.on('message', (message) => {
    if (currentChatId === message.chatId) {
      messageHistory.innerHTML += `<p><strong>${message.sender}</strong>: ${m.content} (${new Date(message.timestamp).toLocaleTimeString()})</p>`;
    } else {
      notificationIndicator.classList.remove('hidden');
      notificationBell.onclick = () => {
        joinChat(message.chatId);
        notificationIndicator.classList.add('hidden');
      };
    }
  });

  socket.on('notification', (data) => {
    if (currentChatId !== data.chatId) {
      notificationIndicator.classList.remove('hidden');
      notificationBell.onclick = () => {
        joinChat(data.chatId);
        notificationIndicator.classList.add('hidden');
      };
    }
  });

  socket.emit('setStatus', 'online');
});