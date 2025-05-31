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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Загрузка...</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <NavBar />
      
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Мои Альбомы</h1>
          
          <div className="flex space-x-2">
            <button
              onClick={toggleSelectMode}
              className={`px-4 py-2 rounded ${selectMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              {selectMode ? 'Завершить выбор' : 'Выбрать альбомы'}
            </button>
            
            {selectMode && (
              <>
                <button
                  onClick={selectAllAlbums}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded"
                >
                  {selectedAlbums.length === albums.length ? 'Снять выделение' : 'Выбрать все'}
                </button>
                
                <button
                  onClick={deleteSelectedAlbums}
                  disabled={selectedAlbums.length === 0}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Удалить выбранные ({selectedAlbums.length})
                </button>
              </>
            )}
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => {
            const isSelected = selectedAlbums.includes(album.id);
            
            return (
              <div 
                key={album.id} 
                className={`bg-white rounded-lg shadow-md overflow-hidden ${selectMode && isSelected ? 'ring-4 ring-blue-500' : ''}`}
                onClick={selectMode ? () => toggleAlbumSelection(album.id) : undefined}
              >
                <div className="p-6">
                  {selectMode && (
                    <div className="flex items-center mb-3">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleAlbumSelection(album.id)}
                        className="w-5 h-5 cursor-pointer mr-2"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-sm text-gray-600">Выбрать</span>
                    </div>
                  )}
                  
                  <h2 className="text-xl font-semibold mb-4">{album.title || 'Без названия'}</h2>
                  <div className="flex justify-between items-center">
                    <div>
                      <Link
                        to={`/admin/${album.id}`}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2"
                        onClick={(e) => selectMode && e.preventDefault()}
                      >
                        Управление
                      </Link>
                      <Link
                        to={`/album/${album.id}`}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                        onClick={(e) => selectMode && e.preventDefault()}
                      >
                        Просмотр
                      </Link>
                    </div>
                    {!selectMode && (
                      <button
                        onClick={() => deleteAlbum(album.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Кнопка создания нового альбома */}
          <div 
            className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center hover:border-gray-400 transition-colors cursor-pointer"
            onClick={createNewAlbum}
          >
            <div className="text-gray-600 hover:text-gray-800 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="block">{creatingAlbum ? 'Создание...' : 'Создать новый альбом'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
