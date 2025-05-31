import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavBar from './NavBar';

const AdminAlbum = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [publicLink, setPublicLink] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  
  // Проверяем, является ли это новым альбомом
  const isNewAlbum = localStorage.getItem('newAlbumCreated') === albumId;
  
  // Функция для возврата на главную страницу
  const handleCancel = () => {
    // Если это новый альбом, удаляем его
    if (isNewAlbum) {
      try {
        // Получаем токен удаления
        const deleteToken = localStorage.getItem(`album_token_${albumId}`);
        
        if (deleteToken) {
          // Удаляем альбом
          axios.delete(`http://localhost:5000/api/albums/${albumId}?token=${deleteToken}`);
          
          // Удаляем токен из localStorage
          localStorage.removeItem(`album_token_${albumId}`);
          localStorage.removeItem('newAlbumCreated');
        }
      } catch (error) {
        console.error('Ошибка при удалении альбома:', error);
      }
    }
    
    // Возвращаемся на главную страницу
    navigate('/');
  };
  
  // Функция для корректного формирования URL изображения
  const getImageUrl = (image) => {
    if (!image) return 'https://via.placeholder.com/400x300?text=Нет+изображения';
    
    // Базовый URL сервера
    const baseUrl = 'http://localhost:5000';
    
    // Если image - это строка (URL или путь)
    if (typeof image === 'string') {
      return image.startsWith('http') ? image : `${baseUrl}${image.startsWith('/') ? image : `/${image}`}`;
    }
    
    // Если image - это объект с полем url
    if (image.url) {
      const url = image.url;
      return url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
    }
    
    // Если есть поле path
    if (image.path) {
      const path = image.path;
      return path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    }
    
    // Если есть только filename
    if (image.filename) {
      return `${baseUrl}/uploads/${albumId}/${image.filename}`;
    }
    
    // Если ничего не подошло
    console.log('Неизвестный формат изображения:', image);
    return 'https://via.placeholder.com/400x300?text=Неизвестный+формат';
  };

  // Get the secret token from localStorage
  const secretToken = localStorage.getItem(`album_token_${albumId}`);

  const fetchAlbumData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Получаем изображения и базовую информацию об альбоме
      const imagesResponse = await axios.get(`http://localhost:5000/api/albums/${albumId}/images`);
      console.log('API Response:', imagesResponse.data);
      console.log('Images data structure:', imagesResponse.data.images);
      
      // Устанавливаем изображения
      setImages(imagesResponse.data.images || []);
      
      // Устанавливаем название альбома из ответа сервера
      if (imagesResponse.data.albumTitle) {
        setAlbumName(imagesResponse.data.albumTitle);
      }
      
    } catch (err) {
      console.error('Error fetching album data:', err);
      setError('Не удалось загрузить данные альбома. Пожалуйста, попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  }, [albumId, secretToken]);

  useEffect(() => {
    // Check if we have the token
    if (!secretToken) {
      setError('Доступ запрещен. У вас нет прав для управления этим альбомом.');
      setLoading(false);
      return;
    }

    // Set the public link
    const host = window.location.origin;
    setPublicLink(`${host}/album/${albumId}`);

    // Fetch album data and images
    fetchAlbumData();
  }, [albumId, secretToken, fetchAlbumData]);

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      setUploading(true);
      setError(null);
      await axios.post(`http://localhost:5000/api/albums/${albumId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // Refresh the album data and image list
      fetchAlbumData();
    } catch (err) {
      console.error('Error uploading images:', err);
      setError('Не удалось загрузить изображения. Пожалуйста, попробуйте еще раз.');
    } finally {
      setUploading(false);
    }
  };

  // Функция для переключения режима выбора
  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    // Если выключаем режим выбора, очищаем список выбранных изображений
    if (selectMode) {
      setSelectedImages([]);
    }
  };

  // Функция для выбора/снятия выбора изображения
  const toggleImageSelection = (image) => {
    const imageId = image.photoId || image.id || image._id || image.filename;
    
    if (selectedImages.includes(imageId)) {
      setSelectedImages(selectedImages.filter(id => id !== imageId));
    } else {
      setSelectedImages([...selectedImages, imageId]);
    }
  };

  // Функция для выбора всех изображений
  const selectAllImages = () => {
    if (selectedImages.length === images.length) {
      // Если все уже выбраны, снимаем выбор
      setSelectedImages([]);
    } else {
      // Иначе выбираем все
      const allImageIds = images.map(img => img.photoId || img.id || img._id || img.filename);
      setSelectedImages(allImageIds);
    }
  };

  // Функция удаления выбранных изображений
  const deleteSelectedImages = async () => {
    if (selectedImages.length === 0) return;
    
    if (!window.confirm(`Вы уверены, что хотите удалить ${selectedImages.length} выбранных изображений?`)) return;
    
    try {
      // Получаем токен удаления для альбома
      const deleteToken = localStorage.getItem(`album_token_${albumId}`);
      
      if (!deleteToken) {
        setError('Не найден токен для удаления изображений');
        return;
      }
      
      // Удаляем каждое выбранное изображение
      for (const imageId of selectedImages) {
        // Находим изображение по ID
        const image = images.find(img => {
          const imgId = img.photoId || img.id || img._id || img.filename;
          return imgId === imageId;
        });
        
        if (image) {
          // Формируем URL для удаления
          const photoId = image.photoId;
          
          if (photoId) {
            const url = `http://localhost:5000/api/albums/${albumId}/images/${photoId}?token=${deleteToken}`;
            await axios.delete(url);
          } else {
            console.error('Не найден photoId для изображения:', image);
          }
        }
      }
      
      // Обновляем список изображений
      setImages(images.filter(img => {
        return !selectedImages.includes(img.photoId);
      }));
      
      // Очищаем список выбранных изображений
      setSelectedImages([]);
      
    } catch (err) {
      console.error('Ошибка при удалении выбранных изображений:', err);
      setError('Не удалось удалить выбранные изображения. Пожалуйста, попробуйте еще раз.');
    }
  };

  // Функция удаления одного изображения
  const deleteImage = async (image) => {
    if (!window.confirm('Вы уверены, что хотите удалить это изображение?')) return;
    
    try {
      const photoId = image.photoId;
      
      if (!photoId) {
        console.error('Не удалось определить photoId изображения:', image);
        return;
      }
      
      // Получаем токен удаления для альбома
      const deleteToken = localStorage.getItem(`album_token_${albumId}`);
      
      if (!deleteToken) {
        setError('Не найден токен для удаления изображения');
        return;
      }
      
      // Формируем URL для удаления
      const url = `http://localhost:5000/api/albums/${albumId}/images/${photoId}?token=${deleteToken}`;
      
      await axios.delete(url);
      
      // Обновляем список изображений
      setImages(images.filter(img => img.photoId !== photoId));
      
      // Удаляем из списка выбранных, если там есть
      if (selectedImages.includes(photoId)) {
        setSelectedImages(selectedImages.filter(id => id !== photoId));
      }
      
    } catch (err) {
      console.error('Ошибка при удалении изображения:', err);
      setError('Не удалось удалить изображение. Пожалуйста, попробуйте еще раз.');
    }
  };

  const deleteAlbum = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/albums/${albumId}?token=${secretToken}`);
      // Clear the token from localStorage
      localStorage.removeItem(`album_token_${albumId}`);
      // Navigate to home
      navigate('/');
    } catch (err) {
      console.error('Error deleting album:', err);
      setError('Не удалось удалить альбом. Пожалуйста, попробуйте еще раз.');
    }
  };

  // Новая функция для обновления названия альбома
  const updateAlbumName = async (newName) => {
    try {
      setIsSaving(true);
      setError(null);
      
      // Отправляем PUT запрос для обновления названия альбома
      console.log(`http://localhost:5000/api/albums/${albumId}`);
      await axios.put(`http://localhost:5000/api/albums/${albumId}`, {
        name: newName
      }, {
        params: { token: secretToken }
      });
      
      setIsEditing(false);
      setAlbumName(newName);
      
      
    } catch (err) {
      console.error('Ошибка при обновлении названия альбома:', err);
      
      // Если маршрут PUT не существует, попробуем PATCH
      if (err.response?.status === 404) {
        try {
          await axios.patch(`http://localhost:5000/api/albums/${albumId}`, {
            name: newName
          }, {
            params: { token: secretToken }
          });
          
          setIsEditing(false);
          setAlbumName(newName);
          
        } catch (patchErr) {
          console.error('Ошибка при обновлении через PATCH:', patchErr);
          setError('Не удалось обновить название альбома. Функция может быть недоступна на сервере.');
        }
      } else {
        setError('Не удалось обновить название альбома. Попробуйте еще раз.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicLink)
      .then(() => {
        alert('Ссылка скопирована в буфер обмена!');
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
      });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-6">Загрузка альбома...</h1>
      </div>
    );
  }

  if (error && !secretToken) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-6">Ошибка доступа</h1>
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Вернуться на главную
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <NavBar />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Управление альбомом</h1>
        {isNewAlbum && (
          <button
            onClick={handleCancel}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
          >
            Отмена
          </button>
        )}
      </div>
      
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        {isEditing ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">Редактирование информации об альбоме</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              await updateAlbumName(albumName);
            }}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="albumName">
                  Название альбома
                </label>
                <input
                  id="albumName"
                  type="text"
                  value={albumName}
                  onChange={(e) => setAlbumName(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Введите название альбома"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                  {isSaving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Информация об альбоме</h2>
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-primary btn-sm"
              >
                Редактировать
              </button>
            </div>
            <div>
              <p className="text-sm text-gray-600">Название альбома</p>
              <p className="text-lg">{albumName || 'Без названия'}</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-blue-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Публичная ссылка на альбом:</h2>
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            value={publicLink} 
            readOnly 
            className="form-input flex-grow"
          />
          <div className="btn-group">
            <button
              onClick={() => window.open(publicLink, '_blank')}
              className="btn btn-primary"
            >
              Посмотреть
            </button>
            <button 
              onClick={copyToClipboard}
              className="btn btn-secondary"
            >
              Копировать
            </button>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Загрузить новые фотографии:</h2>
        <div className="flex items-center">
          <label className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded cursor-pointer">
            {uploading ? 'Загрузка...' : 'Выбрать файлы'}
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleFileUpload} 
              disabled={uploading}
              className="hidden"
            />
          </label>
          <span className="ml-4 text-gray-600">Можно выбрать несколько файлов</span>
        </div>
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Фотографии в альбоме:</h2>
          
          <div className="flex space-x-2">
            <button
              onClick={toggleSelectMode}
              className={`px-4 py-2 rounded ${selectMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              {selectMode ? 'Завершить выбор' : 'Выбрать фото'}
            </button>
            
            {selectMode && (
              <>
                <button
                  onClick={selectAllImages}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded"
                >
                  {selectedImages.length === images.length ? 'Снять выделение' : 'Выбрать все'}
                </button>
                
                <button
                  onClick={deleteSelectedImages}
                  disabled={selectedImages.length === 0}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Удалить выбранные ({selectedImages.length})
                </button>
              </>
            )}
          </div>
        </div>
        
        {images.length === 0 ? (
          <p className="text-gray-500 text-center py-8">В этом альбоме пока нет фотографий</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => {
              // Используем photoId в качестве основного идентификатора
              const imageId = image.photoId;
              const isSelected = selectedImages.includes(imageId);
              
              return (
                <div key={index} className={`relative group ${selectMode && isSelected ? 'ring-4 ring-blue-500' : ''}`}>
                  {selectMode && (
                    <div 
                      className="absolute top-2 left-2 z-10 bg-white bg-opacity-80 rounded-md p-1"
                      onClick={() => toggleImageSelection(image)}
                    >
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => {}} // Обработчик в родительском div
                        className="w-5 h-5 cursor-pointer"
                      />
                    </div>
                  )}
                  
                  <img 
                    src={getImageUrl(image)}
                    alt={`${index + 1}`}
                    className={`w-full h-48 object-cover rounded-lg shadow-md ${selectMode ? 'cursor-pointer' : ''}`}
                    onClick={selectMode ? () => toggleImageSelection(image) : undefined}
                    onError={(e) => {
                      console.error('Ошибка загрузки изображения:', image);
                      // Попробуем альтернативный URL, если основной не сработал
                      if (image.url && !e.target.dataset.retried) {
                        e.target.dataset.retried = 'true';
                        e.target.src = `http://localhost:5000${image.url}`;
                      } else if (image.filename && !e.target.dataset.retriedFilename) {
                        e.target.dataset.retriedFilename = 'true';
                        e.target.src = `http://localhost:5000/uploads/${albumId}/${image.filename}`;
                      } else {
                        e.target.src = 'https://via.placeholder.com/400x300?text=Ошибка+загрузки';
                      }
                    }}
                  />
                  
                  {!selectMode && (
                    <button
                      onClick={() => deleteImage(image)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="mt-12 pt-6 border-t border-gray-300">
        <h2 className="text-xl font-semibold mb-4 text-red-600">Опасная зона:</h2>
        <button
          onClick={deleteAlbum}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
        >
          {deleteConfirm ? 'Подтвердить удаление' : 'Удалить весь альбом'}
        </button>
        {deleteConfirm && (
          <p className="text-red-500 mt-2">
            Это действие нельзя отменить. Все фотографии будут удалены навсегда.
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminAlbum;