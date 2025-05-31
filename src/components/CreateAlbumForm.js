import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavBar from './NavBar';

const CreateAlbumForm = () => {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Функция создания нового альбома
  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Получаем userToken из localStorage
      const userToken = localStorage.getItem('userToken');
      
      if (!userToken) {
        setError('Вы не авторизованы. Пожалуйста, войдите в систему.');
        navigate('/auth');
        return;
      }
      
      // Создаем альбом только с названием
      const response = await axios.post('http://localhost:5000/api/albums', {
        title
      }, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      const { albumId, deleteToken } = response.data;
      
      // Сохраняем токен удаления в localStorage
      localStorage.setItem(`album_token_${albumId}`, deleteToken);
      
      // Переходим на страницу управления новым альбомом
      navigate(`/admin/${albumId}`);
    } catch (err) {
      console.error('Ошибка при создании альбома:', err);
      setError('Не удалось создать новый альбом. Пожалуйста, попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  // Функция отмены создания альбома
  const handleCancel = () => {
    navigate('/profile');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <NavBar />
      
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Создание нового альбома</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleCreateAlbum}>
          <div className="mb-6">
            <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
              Название альбома
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите название альбома"
            />
          </div>
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded"
            >
              Отмена
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Создание...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAlbumForm;
