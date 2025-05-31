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
    <div className="container">
      <div className="form-container animate-fade-in">
        <div className="form-header">
          <h1 className="form-title">
            {isLogin ? 'Вход в аккаунт' : 'Регистрация'}
          </h1>
          <p className="form-subtitle">
            {isLogin ? 'Войдите для доступа к вашим альбомам' : 'Создайте новый аккаунт для хранения фотографий'}
          </p>
        </div>
        
        {error && (
          <div className="form-message form-message-error">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Имя пользователя
              </label>
              <input
                id="username"
                type="text"
                className={`form-input ${validationErrors.username ? 'error' : ''}`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введите имя пользователя"
              />
              {validationErrors.username && (
                <p className="form-error">{validationErrors.username}</p>
              )}
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={`form-input ${validationErrors.email ? 'error' : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Введите ваш email"
            />
            {validationErrors.email && (
              <p className="form-error">{validationErrors.email}</p>
            )}
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              className={`form-input ${validationErrors.password ? 'error' : ''}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
            />
            {validationErrors.password && (
              <p className="form-error">{validationErrors.password}</p>
            )}
          </div>
          
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                Подтвердите пароль
              </label>
              <input
                id="confirmPassword"
                type="password"
                className={`form-input ${validationErrors.confirmPassword ? 'error' : ''}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
              />
              {validationErrors.confirmPassword && (
                <p className="form-error">{validationErrors.confirmPassword}</p>
              )}
            </div>
          )}
          
          <div className="form-actions">
            <button
              type="submit"
              className={`btn btn-primary btn-block ${loading ? 'btn-loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </div>
        </form>
        
        <div className="form-divider">Или</div>
        
        <button
          onClick={toggleAuthMode}
          className="btn btn-secondary btn-block"
        >
          {isLogin ? 'Создать новый аккаунт' : 'Уже есть аккаунт? Войти'}
        </button>
        
        <p className="form-note">
          {isLogin ? 'Для доступа к вашим альбомам необходимо войти в систему' : 'После регистрации вы сможете создавать и управлять своими альбомами'}
        </p>
        

      </div>
    </div>
  );
};

export default Auth;
