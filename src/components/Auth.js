import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('Отправка формы:', isLogin ? 'логин' : 'регистрация');
    console.log('Данные:', { email, password, username: isLogin ? null : username });

    try {
      if (isLogin) {
        // Логин
        console.log('Отправка запроса на логин...');
        const response = await axios.post('http://localhost:5000/api/users/login', {
          email,
          password
        });
        console.log('Ответ от сервера:', response.data);

        if (response.data.success) {
          console.log('Успешный вход, сохраняем данные...');
          // Сохраняем данные пользователя в localStorage
          localStorage.setItem('userId', response.data.userId);
          localStorage.setItem('username', response.data.username);
          
          // Перенаправляем на домашнюю страницу
          console.log('Перенаправляем на главную страницу...');
          navigate('/');
        }
      } else {
        // Регистрация
        console.log('Отправка запроса на регистрацию...');
        const response = await axios.post('http://localhost:5000/api/users/register', {
          username,
          email,
          password
        });
        console.log('Ответ от сервера (регистрация):', response.data);

        if (response.data.success) {
          console.log('Успешная регистрация, переключаемся на форму входа...');
          // После успешной регистрации переключаемся на форму логина
          setIsLogin(true);
          setError('Регистрация успешна! Теперь вы можете войти.');
        }
      }
    } catch (err) {
      console.error('Ошибка аутентификации:', err);
      console.log('Детали ошибки:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        responseData: err.response?.data,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          data: err.config?.data
        }
      });
      setError(err.response?.data?.message || 'Произошла ошибка. Пожалуйста, попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  const handleGuestMode = async () => {
    try {
      setLoading(true);
      // Создаем новый альбом без пользователя
      const response = await axios.post('http://localhost:5000/api/albums');
      const { albumId, deleteToken } = response.data;
      
      // Сохраняем токен для удаления альбома
      localStorage.setItem(`album_token_${albumId}`, deleteToken);
      
      // Перенаправляем на страницу администрирования альбома
      navigate(`/admin/${albumId}`);
    } catch (err) {
      console.error('Ошибка создания гостевого альбома:', err);
      setError('Не удалось создать гостевой альбом. Пожалуйста, попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">
          {isLogin ? 'Вход в аккаунт' : 'Регистрация'}
        </h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="username">
                Имя пользователя
              </label>
              <input
                id="username"
                type="text"
                className="w-full p-2 border border-gray-300 rounded"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full p-2 border border-gray-300 rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="password">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              className="w-full p-2 border border-gray-300 rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-4 transition duration-300 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>
        
        <button
          onClick={toggleAuthMode}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded mb-4 transition duration-300"
        >
          {isLogin ? 'Создать новый аккаунт' : 'Уже есть аккаунт? Войти'}
        </button>
        
        <div className="text-center mt-6">
          <p className="text-gray-600 mb-4">или</p>
          <button
            onClick={handleGuestMode}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300 disabled:opacity-50"
            disabled={loading}
          >
            Продолжить без регистрации
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
