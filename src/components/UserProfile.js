import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const UserProfile = () => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAlbums = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('userToken');
        
        if (!token) {
          console.log('Токен не найден, перенаправление на страницу авторизации');
          navigate('/auth');
          return;
        }

        console.log('Отправка запроса на получение альбомов с токеном');
        // Получаем альбомы пользователя из БД
        const response = await axios.get('http://localhost:5000/api/albums', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Получен ответ от сервера:', response.status);
        const albums = response.data;
        
        // Обновляем токены альбомов в localStorage
        albums.forEach(album => {
          if (album.token) {
            localStorage.setItem(`album_token_${album.id}`, album.token);
          }
        });

        setAlbums(albums);
      } catch (err) {
        console.error('Ошибка при загрузке альбомов:', err);
        if (err.response?.status === 401) {
          console.log('Ошибка авторизации, перенаправление на страницу входа');
          // Очищаем токен, так как он недействителен
          localStorage.removeItem('userToken');
          navigate('/auth');
        } else {
          setError('Не удалось загрузить ваши альбомы: ' + (err.response?.data?.message || err.message));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserAlbums();
  }, [navigate]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Загрузка...</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Мои Альбомы</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <div key={album.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{album.name || 'Без названия'}</h2>
                <p className="text-gray-600 mb-4">
                  {album.description || 'Без описания'}
                </p>
                <div className="flex justify-between items-center">
                  <Link
                    to={`/admin/${album.id}`}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Управление
                  </Link>
                  <Link
                    to={`/album/${album.id}`}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    Просмотр
                  </Link>
                </div>
              </div>
            </div>
          ))}
          
          {/* Кнопка создания нового альбома */}
          <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center hover:border-gray-400 transition-colors">
            <Link
              to="/create-album"
              className="text-gray-600 hover:text-gray-800 text-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="block">Создать новый альбом</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
