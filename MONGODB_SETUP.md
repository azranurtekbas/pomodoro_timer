# MongoDB Backend Kurulum Rehberi

Bu dokümantasyon, Pomodoro Timer uygulamasını MongoDB Atlas ile entegre etmek için gerekli adımları içerir.

## MongoDB Atlas Kurulumu

### 1. MongoDB Atlas Hesabı Oluşturma
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) web sitesine gidin
2. Hesap oluşturun (Google, GitHub ile de kaydolabilirsiniz)
3. Organizasyon ve Proje oluşturun

### 2. Cluster Oluşturma
1. "Create a Database" tıklayın
2. Ücretsiz tier seçin (M0)
3. Cloud Provider olarak AWS seçin
4. Bölge seçin (örn: eu-west-1)
5. "Create Deployment" tıklayın

### 3. Network Erişimi Yapılandırma
1. "Network Access" bölümüne gidin
2. "Add IP Address" tıklayın
3. "Allow Access from Anywhere" seçin (0.0.0.0/0)
4. Confirm tıklayın

### 4. Veritabanı Kullanıcısı Oluşturma
1. "Database Access" bölümüne gidin
2. "Add New Database User" tıklayın
3. Username: `pomodoro_user`
4. Password: güçlü bir şifre belirleyin
5. "Add User" tıklayın

### 5. Connection String Alma
1. Cluster'a gidin
2. "Connect" tıklayın
3. "Drivers" seçin
4. Node.js sürümünü seçin
5. Connection string'i kopyalayın

**Örnek:**
```
mongodb+srv://pomodoro_user:<password>@pomodoro-cluster.mongodb.net/pomodoro_db?retryWrites=true&w=majority
```

## Backend API Kurulumu (Node.js + Express)

### 1. Proje Oluşturma

```bash
mkdir pomodoro_backend
cd pomodoro_backend
npm init -y
```

### 2. Bağımlılıkları Yükleme

```bash
npm install express mongoose cors dotenv bcryptjs jsonwebtoken
npm install --save-dev nodemon
```

### 3. .env Dosyası Oluşturma

```env
MONGODB_URI=mongodb+srv://pomodoro_user:your_password@cluster.mongodb.net/pomodoro_db
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
NODE_ENV=development
```

### 4. Veri Modelleri

#### User Model (models/User.js)
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Şifre hash'leme
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);
```

#### Session Model (models/Session.js)
```javascript
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    enum: ['Ders Çalışma', 'Kodlama', 'Proje', 'Kitap Okuma', 'Diğer'],
    required: true,
  },
  duration: {
    type: Number, // dakika cinsinden
    required: true,
  },
  distractions: {
    type: Number,
    default: 0,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Session', sessionSchema);
```

### 5. Authentication Routes (routes/auth.js)

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    user = new User({ username, email, password });
    await user.save();

    // Create JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Create JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### 6. Session Routes (routes/sessions.js)

```javascript
const express = require('express');
const Session = require('../models/Session');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all sessions
router.get('/', auth, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.userId });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create session
router.post('/', auth, async (req, res) => {
  try {
    const { category, duration, distractions } = req.body;

    const session = new Session({
      userId: req.userId,
      category,
      duration,
      distractions,
    });

    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### 7. Middleware (middleware/auth.js)

```javascript
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = auth;
```

### 8. Ana Server Dosyası (server.js)

```javascript
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Bağlantısı
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sessions', require('./routes/sessions'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 9. package.json Scripts

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

## Uygulamada Entegrasyon

### 1. API URL'ini Güncelleyin

`src/constants/index.js` dosyasını düzenleyin:

```javascript
export const API_CONFIG = {
  BASE_URL: 'http://localhost:5000/api', // veya https://your-backend.com/api
  ENDPOINTS: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    SESSIONS: '/sessions',
    STATS: '/stats',
  }
};
```

### 2. Login Servisini Güncelleyin

`src/services/database.js` dosyasında API çağrılarını açın.

### 3. Token Yönetimi

AsyncStorage'de token kaydedin ve API çağrılarında gönderen:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const getToken = async () => {
  return await AsyncStorage.getItem('auth_token');
};

export const setToken = async (token) => {
  await AsyncStorage.setItem('auth_token', token);
};

// API interceptor
axios.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Deployment

### Heroku'ya Deployment

1. Heroku hesabı oluşturun
2. Heroku CLI yükleyin
3. Terminal'de:
```bash
heroku login
heroku create your-app-name
git push heroku main
```

### Environment Variables Ayarlama

```bash
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_secret
```

## Test

Postman veya cURL ile API test edebilirsiniz:

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Create Session
curl -X POST http://localhost:5000/api/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category":"Kodlama","duration":25,"distractions":2}'
```

## Sorun Giderme

- **CORS Hatası**: CORS middleware'i kontrol edin
- **MongoDB Bağlantısı**: Connection string'i ve IP whitelist'i kontrol edin
- **Token Hatası**: JWT_SECRET'i .env dosyasında belirledikten sonra sunucuyu yeniden başlatın
