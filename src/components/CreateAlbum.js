import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CreateAlbum = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('userToken'); // Получаем токен пользователя
      const response = await axios.post('http://localhost:5000/api/albums', {
        name,
        description
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Сохраняем токен альбома
      localStorage.setItem(`album_token_${response.data.albumId}`, response.data.albumToken);
      
      // Перенаправляем на страницу управления альбомом
      navigate(`/admin/${response.data.albumId}`);
    } catch (err) {
      console.error('Ошибка при создании альбома:', err);
      setError(err.response?.data?.message || 'Не удалось создать альбом');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Создание нового альбома</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Название альбома
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
              Описание
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Создание...' : 'Создать альбом'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAlbum;
