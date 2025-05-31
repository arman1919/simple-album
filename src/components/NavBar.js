import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/NavBar.css';

const NavBar = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

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

  const handleLogout = () => {
    // Очищаем все токены из localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('album_token_')) {
        localStorage.removeItem(key);
      }
    });
    
    // Удаляем токен пользователя
    localStorage.removeItem('userToken');
    localStorage.removeItem('username');
    
    // Перенаправляем на страницу авторизации
    navigate('/auth');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">Админ-панель</Link>
        <div className="navbar-links">
          <button 
            onClick={createNewAlbum} 
            className="navbar-button" 
            disabled={loading}
          >
            {loading ? 'Создание...' : 'Создать новый альбом'}
          </button>
          <Link to="/profile" className="navbar-link">
            Мои альбомы
          </Link>
          <button 
            onClick={handleLogout}
            className="navbar-button"
          >
            Выйти
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
