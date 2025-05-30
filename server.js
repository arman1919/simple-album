  const express = require('express');
  const multer = require('multer');
  const path = require('path');
  const fs = require('fs');
  const cors = require('cors');
  const jwt = require('jsonwebtoken');
  const { v4: uuidv4 } = require('uuid');
  const connectDB = require('./src/config/db');
  const User = require('./src/models/User');
  const Album = require('./src/models/Album');
  const { auth, JWT_SECRET } = require('./src/middleware/auth');

  const app = express();
  const PORT = process.env.PORT || 5000;

  // Connect to MongoDB
  connectDB();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure multer storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const albumId = req.params.albumId;
      const albumDir = path.join(uploadsDir, albumId);
      
      if (!fs.existsSync(albumDir)) {
        fs.mkdirSync(albumDir, { recursive: true });
      }
      
      cb(null, albumDir);
    },
    filename: (req, file, cb) => {
      const uniqueFilename = `${Date.now()}-${file.originalname}`;
      cb(null, uniqueFilename);
    }
  });

  const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (extname && mimetype) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'));
      }
    }
  });

  // We'll use MongoDB for storing album tokens now

  // Routes
  // Create a new album
  app.post('/api/albums', auth, async (req, res) => {
    try {
      console.log('Получен запрос на создание альбома');
      console.log('Тело запроса:', req.body);
      
      const { title } = req.body;
      const userId = req.user.userId;
      const albumId = uuidv4();
      const deleteToken = uuidv4();
      
      console.log('Созданные идентификаторы:', { albumId, deleteToken });
      
      // Create album directory
      const albumDir = path.join(uploadsDir, albumId);
      console.log('Путь к директории альбома:', albumDir);
      
      if (!fs.existsSync(albumDir)) {
        console.log('Создание директории альбома...');
        fs.mkdirSync(albumDir, { recursive: true });
      }
      
      // Create new album in database
      console.log('Создание нового альбома в базе данных...');
      const newAlbum = new Album({
        albumId,
        userId: userId || 'anonymous', // If no userId provided, use 'anonymous'
        title: title || 'Untitled Album',
        deleteToken,
        photos: []
      });
      
      console.log('Объект альбома создан:', newAlbum);
      
      try {
        console.log('Сохранение альбома в базе данных...');
        await newAlbum.save();
        console.log('Альбом успешно сохранен в базе данных');
      } catch (saveError) {
        console.error('Ошибка при сохранении альбома:', saveError);
        throw saveError; // Перебросить ошибку для обработки в внешнем блоке catch
      }
      
      console.log('Отправка ответа клиенту...');
      res.json({ 
        success: true,
        albumId, 
        deleteToken,
        title: newAlbum.title
      });
      console.log('Ответ отправлен');
    } catch (error) {
      console.error('Error creating album:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Upload images to an album
  app.post('/api/albums/:albumId/images', upload.array('images', 10), async (req, res) => {
    try {
      const albumId = req.params.albumId;
      
      // Find the album in the database
      const album = await Album.findOne({ albumId });
      
      if (!album) {
        return res.status(404).json({ success: false, message: 'Album not found' });
      }
      
      const uploadedFiles = req.files.map(file => {
        const photoId = uuidv4();
        const photoData = {
          photoId,
          filename: file.filename,
          url: `/uploads/${albumId}/${file.filename}`,
          uploadedAt: new Date()
        };
        
        // Add photo to album's photos array
        album.photos.push(photoData);
        
        return photoData;
      });
      
      // Save the updated album
      await album.save();
      
      res.json({ success: true, files: uploadedFiles });
    } catch (error) {
      console.error('Error uploading images:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Get all images in an album
  app.get('/api/albums/:albumId/images', async (req, res) => {
    try {
      const albumId = req.params.albumId;
      
      // Find the album in the database
      const album = await Album.findOne({ albumId });
      
      if (!album) {
        return res.status(404).json({ success: false, message: 'Album not found' });
      }
      
      // Return photos from the database
      res.json({ 
        success: true, 
        images: album.photos,
        albumTitle: album.title
      });
    } catch (error) {
      console.error('Error getting album images:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Get public album images (no auth required)
  app.get('/api/albums/:albumId/public', async (req, res) => {
    try {
      const albumId = req.params.albumId;
      const album = await Album.findOne({ albumId });

      if (!album) {
        return res.status(404).json({ success: false, message: 'Album not found' });
      }

      // Return only the necessary image data (e.g., URLs)
      // The frontend PublicAlbum.js expects response.data.images
      // and each image in the array to have a .url property or be a string URL.
      // album.photos is an array of objects like { photoId, filename, url, uploadedAt }
      res.json({ 
        success: true, 
        images: album.photos.map(photo => ({ url: photo.url, filename: photo.filename })) // Отправляем url и filename
        // Или если фронтенд ожидает только URL: images: album.photos.map(photo => photo.url)
      });
    } catch (error) {
      console.error('Error getting public album images:', error);
      res.status(500).json({ success: false, message: 'Error retrieving album data.' });
    }
  });


  // Delete an image
  app.delete('/api/albums/:albumId/images/:photoId', async (req, res) => {
    try {
      const { albumId, photoId } = req.params;
      const { token } = req.query;
      
      // Find the album in the database
      const album = await Album.findOne({ albumId });
      
      if (!album) {
        return res.status(404).json({ success: false, message: 'Album not found' });
      }
      
      // Verify token
      if (album.deleteToken !== token) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
      }
      
      // Find the photo in the album's photos array
      const photoIndex = album.photos.findIndex(photo => photo.photoId === photoId);
      
      if (photoIndex === -1) {
        return res.status(404).json({ success: false, message: 'Photo not found' });
      }
      
      // Get the filename before removing from array
      const filename = album.photos[photoIndex].filename;
      
      // Remove the photo from the photos array
      album.photos.splice(photoIndex, 1);
      
      // Save the updated album
      await album.save();
      
      // Delete the file from the filesystem
      const filePath = path.join(uploadsDir, albumId, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Delete an entire album
  app.delete('/api/albums/:albumId', async (req, res) => {
    try {
      const { albumId } = req.params;
      const { token } = req.query;
      
      // Find the album in the database
      const album = await Album.findOne({ albumId });
      
      if (!album) {
        return res.status(404).json({ success: false, message: 'Album not found' });
      }
      
      // Verify token
      if (album.deleteToken !== token) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
      }
      
      // Delete the album from the database
      await Album.deleteOne({ albumId });
      
      // Delete all files in the directory
      const albumDir = path.join(uploadsDir, albumId);
      if (fs.existsSync(albumDir)) {
        fs.readdirSync(albumDir).forEach(file => {
          fs.unlinkSync(path.join(albumDir, file));
        });
        
        // Delete the directory
        fs.rmdirSync(albumDir);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting album:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Verify album exists and get album info
  app.get('/api/albums/:albumId', async (req, res) => {
    try {
      const { albumId } = req.params;
      
      // Find the album in the database
      const album = await Album.findOne({ albumId });
      
      if (album) {
        res.json({ 
          success: true, 
          exists: true,
          title: album.title,
          createdAt: album.createdAt,
          photoCount: album.photos.length
        });
      } else {
        res.json({ success: true, exists: false });
      }
    } catch (error) {
      console.error('Error verifying album:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Serve static assets in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('build'));
    
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
    });
  }

  // User routes

  // Register a new user
  app.post('/api/users/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'User with this email or username already exists' 
        });
      }
      
      // Create a new user
      const userId = uuidv4();
      // In a real app, you would hash the password here
      const passwordHash = password; // Replace with proper hashing
      
      const newUser = new User({
        userId,
        username,
        email,
        passwordHash
      });
      
      await newUser.save();
      
      res.status(201).json({ 
        success: true, 
        userId,
        username
      });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Login user
  app.post('/api/users/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Find the user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      
      // In a real app, you would verify the hashed password here
      if (user.passwordHash !== password) { // Replace with proper verification
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      
      // Create JWT token
      const token = jwt.sign(
        { userId: user.userId, username: user.username },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({ 
        success: true, 
        token,
        username: user.username
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

    app.put('/api/albums/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const { token } = req.query;
      
      // Проверка токена доступа
      // Найдем альбом в базе данных
      const album = await Album.findOne({ albumId: id });
      
      if (!album) {
        return res.status(404).json({ success: false, error: 'Альбом не найден' });
      }
      
      // Проверяем токен
      if (!token || album.deleteToken !== token) {
        return res.status(403).json({ success: false, error: 'Неверный токен доступа' });
      }
      
      // Обновление альбома в базе данных - альбом уже найден выше
      
      album.title = name; // Используем поле title вместо name
      await album.save();
      
      res.json({ 
        success: true,
        message: 'Название альбома успешно обновлено',
        album: {
          id: album.albumId,
          title: album.title
        }
      });
      
    } catch (error) {
      console.error('Ошибка при обновлении альбома:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Get all albums for authenticated user
  app.get('/api/albums', auth, async (req, res) => {
    try {
      console.log('Получен запрос на получение альбомов');
      const userId = req.user.userId;
      console.log('Идентификатор пользователя:', userId);
      
      // Find all albums for this user
      const albums = await Album.find({ userId });
      console.log('Найдено альбомов:', albums.length);
      
      const formattedAlbums = albums.map(album => ({
        id: album.albumId,
        title: album.title || 'Без названия',
        description: album.description || 'Без описания',
        createdAt: album.createdAt,
        photoCount: album.photos.length,
        token: album.deleteToken
      }));

      console.log('Отправка ответа клиенту');
      res.json(formattedAlbums);
    } catch (error) {
      console.error('Ошибка при получении альбомов:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

