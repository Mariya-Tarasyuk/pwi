document.addEventListener('DOMContentLoaded', async () => {
  console.log("messages.js loaded");

  // 1. Отримати username з PHP-сесії
  let username = null;
  try {
    const res = await fetch('/api/auth.php?action=check', { credentials: 'include' });
    const data = await res.json();
    if (data.success && data.username) {
      username = data.username;
    } else {
      alert("Ви не авторизовані. Будь ласка, увійдіть у систему.");
      window.location.href = '/html/login.html';
      return;
    }
  } catch (e) {
    alert("Помилка авторизації.");
    window.location.href = '/html/login.html';
    return;
  }

  if (!username) {
    alert("Не вдалося отримати ім'я користувача. Перезавантажте сторінку або увійдіть знову.");
    window.location.href = '/html/login.html';
    return;
  }

  // 2. Створюємо сокет без JWT
  const socket = io('http://192.168.0.29:3000', {
    query: { username }
  });

  // Далі використовуйте username для всіх дій у чаті

  // Очищаємо всі чати перед завантаженням нових
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

  // Fetch initial chats (передавайте username у query або body, якщо потрібно)
  fetch(`http://192.168.0.29:3000/api/chats?username=${encodeURIComponent(username)}`)
    .then(res => res.json())
    .then(data => {
      console.log("Fetched chats", data);
      if (data.success && Array.isArray(data.chats)) {
        data.chats.forEach(chat => {
          const div = document.createElement('div');
          div.className = `p-2 border rounded ${chat.members.includes(username) ? 'bg-purple-200' : ''} ${chat.createdBy === username ? 'font-bold' : ''}`;
          div.textContent = chat.name || chat.members.join(', ');
          div.onclick = () => joinChat(chat._id);
          chatList.appendChild(div);
        });
      }
    });

  // 1. Завантаження історії
  function joinChat(chatId) {
    // Очищаємо історію повідомлень перед завантаженням нових
    const messageHistory = document.getElementById('messageHistory');
    messageHistory.innerHTML = '';

    currentChatId = chatId;

    // Завантажуємо повідомлення
    fetch(`http://192.168.0.29:3000/api/messages?chatId=${chatId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.messages)) {
          messageHistory.innerHTML = '';
          data.messages.forEach(msg => {
            messageHistory.innerHTML += `
            <p><strong>${msg.sender}</strong>: ${msg.content} 
            (${new Date(msg.timestamp).toLocaleTimeString()})</p>
          `;
          });
        }
      });

    // Завантажуємо учасників чату
    fetch(`http://192.168.0.29:3000/api/chats?username=${encodeURIComponent(username)}`)
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

    // Приєднуємось до кімнати чату
    socket.emit('joinChat', chatId);
  }

  // Send message
  sendMessageBtn.onclick = () => {
    const content = messageInput.value;
    if (content && currentChatId) {
      socket.emit('sendMessage', { chatId: currentChatId, content });
      messageInput.value = '';
    }
  };

  const userSelectModal = document.getElementById('userSelectModal');
  const userList = document.getElementById('userList');
  const createChatBtn = document.getElementById('createChatBtn');
  const closeUserModal = document.getElementById('closeUserModal');

  newChatBtn.onclick = async () => {
    // Отримати список користувачів з MySQL
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

  // Створення чату
  createChatBtn.onclick = () => {
    const checked = Array.from(userList.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    if (checked.length === 0) return alert('Select at least one user');
    fetch('http://192.168.0.29:3000/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Chat with ${[username, ...checked].join(', ')}`,
        members: [username, ...checked],
        createdBy: username // ДОДАЙТЕ ЦЕ
      })
    }).then(res => res.json()).then(data => {
      if (data.success) {
        userSelectModal.classList.add('hidden');
        joinChat(data.chatId);
      }
    });
  };

  // Додавання учасника
  addMemberBtn.onclick = () => {
    const member = prompt('Enter username to add');
    if (member && currentChatId) {
      fetch(`http://192.168.0.29:3000/api/chats/${currentChatId}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member })
      }).then(res => res.json()).then(data => {
        if (data.success) membersList.innerHTML += `<div>${member}</div>`;
      });
    }
  };

  // 2. Додавання нового повідомлення через Socket.IO
  socket.on('message', (msg) => {
    if (msg.chatId === currentChatId) {
      messageHistory.innerHTML += `<p><strong>${msg.sender}</strong>: ${msg.content} (${new Date(msg.timestamp).toLocaleTimeString()})</p>`;
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

  const elements = {
    indicator: notificationIndicator,
    notificationDropdown: document.getElementById('notificationDropdown'),
    bellIcon: notificationBell
  };

  elements.bellIcon.addEventListener("dblclick", function () {
    elements.bellIcon.classList.add("bell-animation");
    setTimeout(() => elements.bellIcon.classList.remove("bell-animation"), 500);
  });

  // Далі ваш існуючий код (перевірка токена, створення сокета і т.д.)
  // ...

});

