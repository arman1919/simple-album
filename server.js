const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

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

// Store album tokens (in a real app, this would be in a database)
const albumTokens = {};

// Routes
// Create a new album
app.post('/api/albums', (req, res) => {
  const albumId = uuidv4();
  const secretToken = uuidv4();
  
  // Create album directory
  const albumDir = path.join(uploadsDir, albumId);
  if (!fs.existsSync(albumDir)) {
    fs.mkdirSync(albumDir, { recursive: true });
  }
  
  // Store the secret token
  albumTokens[albumId] = secretToken;
  
  res.json({ albumId, secretToken });
});

// Upload images to an album
app.post('/api/albums/:albumId/images', upload.array('images', 10), (req, res) => {
  try {
    const albumId = req.params.albumId;
    const uploadedFiles = req.files.map(file => {
      return {
        filename: file.filename,
        path: `/uploads/${albumId}/${file.filename}`
      };
    });
    
    res.json({ success: true, files: uploadedFiles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all images in an album
app.get('/api/albums/:albumId/images', (req, res) => {
  try {
    const albumId = req.params.albumId;
    const albumDir = path.join(uploadsDir, albumId);
    
    if (!fs.existsSync(albumDir)) {
      return res.status(404).json({ success: false, message: 'Album not found' });
    }
    
    const files = fs.readdirSync(albumDir);
    const images = files.map(file => {
      return {
        filename: file,
        path: `/uploads/${albumId}/${file}`
      };
    });
    
    res.json({ success: true, images });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete an image
app.delete('/api/albums/:albumId/images/:filename', (req, res) => {
  try {
    const { albumId, filename } = req.params;
    const { token } = req.query;
    
    // Verify token (simple verification, would be more secure in a real app)
    if (albumTokens[albumId] !== token) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    
    const filePath = path.join(uploadsDir, albumId, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'File not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete an entire album
app.delete('/api/albums/:albumId', (req, res) => {
  try {
    const { albumId } = req.params;
    const { token } = req.query;
    
    // Verify token
    if (albumTokens[albumId] !== token) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    
    const albumDir = path.join(uploadsDir, albumId);
    
    if (fs.existsSync(albumDir)) {
      // Delete all files in the directory
      fs.readdirSync(albumDir).forEach(file => {
        fs.unlinkSync(path.join(albumDir, file));
      });
      
      // Delete the directory
      fs.rmdirSync(albumDir);
      
      // Remove token
      delete albumTokens[albumId];
      
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'Album not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify album exists
app.get('/api/albums/:albumId', (req, res) => {
  const { albumId } = req.params;
  const albumDir = path.join(uploadsDir, albumId);
  
  if (fs.existsSync(albumDir)) {
    res.json({ success: true, exists: true });
  } else {
    res.json({ success: true, exists: false });
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('build'));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
