const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Імпорт моделі User
const { User } = require('/university/year2-sem2/pwi/server.js');

// Підключення до MongoDB (видалені застарілі опції)
mongoose.connect('mongodb://localhost:27017/chatDB')
  .then(async () => {
    console.log('Connected to MongoDB for initialization');

    const initialUsers = [
      { username: 'admin', password: bcrypt.hashSync('password', 10) },
      { username: 'annsmith', password: bcrypt.hashSync('password', 10) },
      { username: 'jamesbond', password: bcrypt.hashSync('password', 10) },
      { username: 'ivonstan', password: bcrypt.hashSync('password', 10) },
    ];

    for (const user of initialUsers) {
      const existingUser = await User.findOne({ username: user.username });
      if (existingUser) {
        console.log(`User ${user.username} already exists`);
        continue;
      }
      await new User(user).save();
      console.log(`User ${user.username} saved`);
    }

    mongoose.connection.close();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });