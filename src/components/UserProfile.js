import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavBar from './NavBar';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

const UserProfile = () => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [selectedAlbums, setSelectedAlbums] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const navigate = useNavigate();

  // Функция перехода на страницу создания нового альбома
  const createNewAlbum = () => {
    // Проверяем авторизацию
    const userToken = localStorage.getItem('userToken');
    
    if (!userToken) {
      alert('Вы не авторизованы. Пожалуйста, войдите в систему.');
      navigate('/auth');
      return;
    }
    
    // Переходим на страницу создания альбома
    navigate('/create-album');
  };
  
  // Функция для переключения режима выбора
  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    // Если выключаем режим выбора, очищаем список выбранных альбомов
    if (selectMode) {
      setSelectedAlbums([]);
    }
  };

  // Функция для выбора/снятия выбора альбома
  const toggleAlbumSelection = (albumId) => {
    if (selectedAlbums.includes(albumId)) {
      setSelectedAlbums(selectedAlbums.filter(id => id !== albumId));
    } else {
      setSelectedAlbums([...selectedAlbums, albumId]);
    }
  };

  // Функция для выбора всех альбомов
  const selectAllAlbums = () => {
    if (selectedAlbums.length === albums.length) {
      // Если все уже выбраны, снимаем выбор
      setSelectedAlbums([]);
    } else {
      // Иначе выбираем все
      const allAlbumIds = albums.map(album => album.id);
      setSelectedAlbums(allAlbumIds);
    }
  };

  // Функция удаления выбранных альбомов
  const deleteSelectedAlbums = () => {
    if (selectedAlbums.length === 0) return;
    
    confirmAlert({
      title: 'Подтверждение удаления',
      message: `Вы уверены, что хотите удалить ${selectedAlbums.length} выбранных альбомов? Это действие нельзя отменить.`,
      buttons: [
        {
          label: 'Да, удалить',
          onClick: async () => {
            try {
              // Удаляем каждый выбранный альбом
              for (const albumId of selectedAlbums) {
                const deleteToken = localStorage.getItem(`album_token_${albumId}`);
                
                if (deleteToken) {
                  await axios.delete(`http://localhost:5000/api/albums/${albumId}?token=${deleteToken}`);
                  localStorage.removeItem(`album_token_${albumId}`);
                }
              }
              
              // Обновляем список альбомов
              setAlbums(albums.filter(album => !selectedAlbums.includes(album.id)));
              
              // Очищаем список выбранных альбомов
              setSelectedAlbums([]);
              
              alert('Выбранные альбомы успешно удалены.');
            } catch (err) {
              console.error('Ошибка при удалении альбомов:', err);
              alert('Не удалось удалить некоторые альбомы. Пожалуйста, попробуйте еще раз.');
            }
          }
        },
        {
          label: 'Отмена',
          onClick: () => {}
        }
      ]
    });
  };

  // Функция удаления альбома
  const deleteAlbum = (albumId) => {
    const deleteToken = localStorage.getItem(`album_token_${albumId}`);
    
    if (!deleteToken) {
      alert('Не удалось найти токен удаления для этого альбома.');
      return;
    }
    
    confirmAlert({
      title: 'Подтверждение удаления',
      message: 'Вы уверены, что хотите удалить этот альбом? Это действие нельзя отменить.',
      buttons: [
        {
          label: 'Да, удалить',
          onClick: async () => {
            try {
              await axios.delete(`http://localhost:5000/api/albums/${albumId}?token=${deleteToken}`);
              
              // Удаляем токен из localStorage
              localStorage.removeItem(`album_token_${albumId}`);
              
              // Обновляем список альбомов
              setAlbums(albums.filter(album => album.id !== albumId));
              
            } catch (err) {
              console.error('Ошибка при удалении альбома:', err);
              alert('Не удалось удалить альбом. Пожалуйста, попробуйте еще раз.');
            }
          }
        },
        {
          label: 'Отмена',
          onClick: () => {}
        }
      ]
    });
  };
  
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
      <div className="container">
        <NavBar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Загрузка альбомов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <NavBar />
      
      <div className="content-container animate-fade-in-up">
        <div className="content-header">
          <h1 className="page-title">Мои Альбомы</h1>
          
          <div className="btn-group">
            <button
              onClick={toggleSelectMode}
              className={`btn ${selectMode ? 'btn-primary' : 'btn-secondary'}`}
            >
              {selectMode ? 'Завершить выбор' : 'Выбрать альбомы'}
            </button>
            
            {selectMode && (
              <>
                <button
                  onClick={selectAllAlbums}
                  className="btn btn-secondary"
                >
                  {selectedAlbums.length === albums.length ? 'Снять выделение' : 'Выбрать все'}
                </button>
                
                <button
                  onClick={deleteSelectedAlbums}
                  disabled={selectedAlbums.length === 0}
                  className="btn btn-danger"
                >
                  Удалить выбранные ({selectedAlbums.length})
                </button>
              </>
            )}
          </div>
        </div>
        
        {error && (
          <div className="form-message form-message-error animate-fade-in">
            {error}
          </div>
        )}

        <div className="albums-grid">
          {albums.map((album, index) => {
            const isSelected = selectedAlbums.includes(album.id);
            
            return (
              <div
                key={album.id}
                className={`album-card ${isSelected ? 'selected' : ''} animate-fade-in-up`}
                style={{animationDelay: `${index * 0.05}s`}}
              >
                {album.photoCount > 0 && (
                  <div className="album-badge album-badge-photos">
                    {album.photoCount} фото
                  </div>
                )}
                
                {selectMode && (
                  <div className="album-card-checkbox">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleAlbumSelection(album.id)}
                      className="form-checkbox"
                    />
                  </div>
                )}
                
                <div className="album-card-header">
                  <h2 className="album-card-title">{album.title || 'Без названия'}</h2>
                  <div className="album-card-meta">
                    <span>
                      <i className="far fa-calendar"></i> 
                      {new Date(album.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                          
                <div className="album-card-footer">
                  <div className="btn-group">
                    <Link
                      to={`/admin/${album.id}`}
                      className="btn btn-primary btn-sm"
                      onClick={(e) => selectMode && e.preventDefault()}
                    >
                      Управление
                    </Link>
                    <Link
                      to={`/album/${album.id}`}
                      className="btn btn-success btn-sm"
                      onClick={(e) => selectMode && e.preventDefault()}
                    >
                      Просмотр
                    </Link>
                  </div>
                </div>
                
                {!selectMode && (
                  <div className="album-card-action">
                    <button
                      onClick={() => deleteAlbum(album.id)}
                      className="btn btn-danger btn-sm"
                    >
                      Удалить
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Кнопка создания нового альбома */}
          <div 
            className="album-card create-album-card animate-fade-in-up"
            style={{animationDelay: `${albums.length * 0.05}s`}}
            onClick={createNewAlbum}
          >
            <div className="album-card-content">
              <div className="create-album-icon">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="create-album-title">{creatingAlbum ? 'Создание...' : 'Создать новый альбом'}</h3>
              <p className="create-album-text">Добавьте новый альбом для ваших фотографий</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
