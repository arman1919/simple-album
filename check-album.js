const mongoose = require('mongoose');
const Album = require('./src/models/Album');
const connectDB = require('./src/config/db');

const albumId = '10253332-c298-41bb-9c44-c6a63285f254';

async function checkAlbum() {
  try {
    // Подключение к базе данных
    await connectDB();
    
    console.log('Проверка альбома с ID:', albumId);
    
    // Поиск альбома в базе данных
    const album = await Album.findOne({ albumId });
    
    if (album) {
      console.log('Альбом найден:');
      console.log('Название:', album.title);
      console.log('Количество фотографий:', album.photos.length);
      console.log('Первые 3 фото (если есть):');
      album.photos.slice(0, 3).forEach((photo, index) => {
        console.log(`Фото ${index + 1}:`, photo.url);
      });
    } else {
      console.log('Альбом с ID', albumId, 'не найден в базе данных.');
    }
    
    // Закрытие соединения с базой данных
    await mongoose.connection.close();
    console.log('Соединение с базой данных закрыто.');
  } catch (error) {
    console.error('Ошибка при проверке альбома:', error);
    process.exit(1);
  }
}

checkAlbum();
