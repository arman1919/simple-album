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
    <div className="container">
      <NavBar />
      
      <div className="form-container animate-slide-up">
        <div className="form-header">
          <h1 className="form-title">Создание нового альбома</h1>
          <p className="form-subtitle">Введите название для вашего нового альбома</p>
        </div>
        
        {error && (
          <div className="form-message form-message-error">
            {error}
          </div>
        )}
        
        <form onSubmit={handleCreateAlbum}>
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Название альбома
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              placeholder="Введите название альбома"
              required
            />
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-secondary"
            >
              Отмена
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
            >
              {loading ? 'Создание...' : 'Создать альбом'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAlbumForm;
