import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavBar from './NavBar';

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Проверяем, авторизован ли пользователь при загрузке компонента
    const userToken = localStorage.getItem('userToken');
    const storedUsername = localStorage.getItem('username');
    
    if (userToken && storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
    } else {
      // Если нет токена, очищаем все данные и перенаправляем на авторизацию
      localStorage.removeItem('username');
      localStorage.removeItem('userToken');
      setIsLoggedIn(false);
      setUsername('');
      navigate('/auth');
    }
  }, [navigate]);

  const handleLogout = () => {
    // Удаляем данные пользователя из localStorage
    localStorage.removeItem('userToken');
    localStorage.removeItem('username');
    
    // Обновляем состояние
    setIsLoggedIn(false);
    setUsername('');
    
    // Перенаправляем на страницу аутентификации
    navigate('/auth');
  };

  const createNewAlbum = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Получаем userToken из localStorage
      const userToken = localStorage.getItem('userToken');
      
      if (!userToken) {
        setError('Вы не авторизованы. Пожалуйста, войдите в систему.');
        setLoading(false);
        navigate('/auth');
        return;
      }
      
      console.log('Отправка запроса на создание альбома...');
      const response = await axios.post('http://localhost:5000/api/albums', {}, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      console.log('Ответ от сервера:', response.data);
      const { albumId, deleteToken } = response.data;
      
      // Save the delete token to localStorage for this album
      localStorage.setItem(`album_token_${albumId}`, deleteToken);
      
      // Устанавливаем флаг нового альбома
      localStorage.setItem('newAlbumCreated', albumId);
      
      // Navigate to the admin page for the new album
      navigate(`/admin/${albumId}`);
    } catch (err) {
      setError('Failed to create a new album. Please try again.');
      console.error('Error creating album:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {isLoggedIn && <NavBar />}
      
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">Онлайн Фотоальбом</h1>
        <p className="text-xl mb-6">
          Создайте свой фотоальбом и поделитесь им с друзьями и коллегами
        </p>
        
        {isLoggedIn ? (
          <div className="flex justify-center space-x-4 mb-4">
            <button
              onClick={() => navigate('/create-album')}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 disabled:opacity-50"
            >
              {loading ? 'Создание...' : 'Создать новый альбом'}
            </button>
          </div>
        ) : (
          <div className="mt-6">
            <button
              onClick={() => navigate('/auth')}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
            >
              Войти или зарегистрироваться
            </button>
          </div>
        )}
        
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
      
      <div className="bg-gray-100 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Как это работает:</h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Нажмите кнопку "Создать новый альбом"</li>
          <li>Загрузите свои фотографии в альбом</li>
          <li>Поделитесь публичной ссылкой с друзьями</li>
          <li>Управляйте своими фотографиями через админскую панель</li>
        </ol>

      </div>
    </div>
  );
};

export default Home;
