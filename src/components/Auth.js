import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();

  // Функция валидации email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return 'Электронная почта обязательна';
    } else if (!emailRegex.test(email)) {
      return 'Неверный формат электронной почты';
    }
    return '';
  };

  // Функция валидации пароля
  const validatePassword = (password) => {
    if (!password) {
      return 'Пароль обязателен';
    } else if (password.length < 6) {
      return 'Пароль должен содержать минимум 6 символов';
    }
    return '';
  };

  // Функция валидации подтверждения пароля
  const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword) {
      return 'Подтверждение пароля обязательно';
    } else if (password !== confirmPassword) {
      return 'Пароли не совпадают';
    }
    return '';
  };

  // Функция валидации имени пользователя
  const validateUsername = (username) => {
    if (!username) {
      return 'Имя пользователя обязательно';
    } else if (username.length < 3) {
      return 'Имя пользователя должно содержать минимум 3 символа';
    }
    return '';
  };

  // Функция валидации формы
  const validateForm = () => {
    const errors = {
      email: validateEmail(email),
      password: validatePassword(password),
      username: isLogin ? '' : validateUsername(username),
      confirmPassword: isLogin ? '' : validateConfirmPassword(password, confirmPassword)
    };

    setValidationErrors(errors);

    // Возвращаем true, если нет ошибок
    return !Object.values(errors).some(error => error !== '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Проверяем валидность формы
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    console.log('Отправка формы:', isLogin ? 'логин' : 'регистрация');

    try {
      if (isLogin) {
        // Логин
        console.log('Отправка запроса на логин...');
        const response = await axios.post('http://localhost:5000/api/users/login', {
          email,
          password
        });

        if (response.data.success) {
          console.log('Успешный вход, сохраняем данные...');
          // Сохраняем данные пользователя в localStorage
          localStorage.setItem('userToken', response.data.token);
          localStorage.setItem('username', response.data.username);
          
          // Перенаправляем на домашнюю страницу
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

        if (response.data.success) {
          console.log('Успешная регистрация, переключаемся на форму входа...');
          // После успешной регистрации переключаемся на форму логина
          setIsLogin(true);
          setError('Регистрация успешна! Теперь вы можете войти.');
        }
      }
    } catch (err) {
      console.error('Ошибка аутентификации:', err);
      setError(err.response?.data?.message || 'Произошла ошибка. Пожалуйста, попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
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
                className={`w-full p-2 border ${validationErrors.username ? 'border-red-500' : 'border-gray-300'} rounded`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              {validationErrors.username && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.username}</p>
              )}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={`w-full p-2 border ${validationErrors.email ? 'border-red-500' : 'border-gray-300'} rounded`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {validationErrors.email && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="password">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              className={`w-full p-2 border ${validationErrors.password ? 'border-red-500' : 'border-gray-300'} rounded`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {validationErrors.password && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
            )}
          </div>
          
          {!isLogin && (
            <div className="mb-6">
              <label className="block text-gray-700 mb-2" htmlFor="confirmPassword">
                Подтвердите пароль
              </label>
              <input
                id="confirmPassword"
                type="password"
                className={`w-full p-2 border ${validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {validationErrors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.confirmPassword}</p>
              )}
            </div>
          )}
          
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
        

      </div>
    </div>
  );
};

export default Auth;
