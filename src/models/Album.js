const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  photoId: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const albumSchema = new mongoose.Schema({
  albumId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    default: 'Untitled Album'
  },
  deleteToken: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  photos: [photoSchema]
});

const Album = mongoose.model('Album', albumSchema, 'album_dbs');

module.exports = Album;
