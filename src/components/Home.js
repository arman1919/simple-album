import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const createNewAlbum = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Отправка запроса на создание альбома...');
      const response = await axios.post('http://localhost:5000/api/albums');
      console.log('Ответ от сервера:', response.data);
      const { albumId, deleteToken } = response.data;
      
      // Save the delete token to localStorage for this album
      localStorage.setItem(`album_token_${albumId}`, deleteToken);
      
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
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">Онлайн Фотоальбом</h1>
        <p className="text-xl mb-6">
          Создайте свой фотоальбом и поделитесь им с друзьями и коллегами
        </p>
        <button
          onClick={createNewAlbum}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 disabled:opacity-50"
        >
          {loading ? 'Создание...' : 'Создать новый альбом'}
        </button>
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
