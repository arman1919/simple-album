import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminAlbum = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [publicLink, setPublicLink] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Get the secret token from localStorage
  const secretToken = localStorage.getItem(`album_token_${albumId}`);

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/albums/${albumId}/images`);
      setImages(response.data.images || []);
    } catch (err) {
      console.error('Error fetching images:', err);
      setError('Не удалось загрузить изображения. Пожалуйста, попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  }, [albumId]);

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

    // Fetch images
    fetchImages();
  }, [albumId, secretToken, fetchImages]);

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
      // Refresh the image list
      fetchImages();
    } catch (err) {
      console.error('Error uploading images:', err);
      setError('Не удалось загрузить изображения. Пожалуйста, попробуйте еще раз.');
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (filename) => {
    if (!window.confirm('Вы уверены, что хотите удалить это изображение?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/albums/${albumId}/images/${filename}?token=${secretToken}`);
      // Refresh the image list
      fetchImages();
    } catch (err) {
      console.error('Error deleting image:', err);
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
      <h1 className="text-3xl font-bold mb-6 text-center">Управление альбомом</h1>
      
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      
      <div className="bg-blue-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Публичная ссылка на альбом:</h2>
        <div className="flex items-center">
          <input 
            type="text" 
            value={publicLink} 
            readOnly 
            className="flex-grow p-2 border rounded-l"
          />
          <button 
            onClick={copyToClipboard}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-r"
          >
            Копировать
          </button>
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
        <h2 className="text-xl font-semibold mb-4">Фотографии в альбоме:</h2>
        
        {images.length === 0 ? (
          <p className="text-gray-500 text-center py-8">В этом альбоме пока нет фотографий</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img 
                  src={`http://localhost:5000${image.path}`} 
                  alt={`${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg shadow-md"
                />
                <button
                  onClick={() => deleteImage(image.filename)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
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
