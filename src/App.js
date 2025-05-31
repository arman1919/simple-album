import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Импортируем новые стили вместо App.css
import './styles/index.css';
import Home from './components/Home';
import AdminAlbum from './components/AdminAlbum';
import PublicAlbum from './components/PublicAlbum';
import NotFound from './components/NotFound';
import Auth from './components/Auth';
import UserProfile from './components/UserProfile';
import CreateAlbumForm from './components/CreateAlbumForm';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Проверяем аутентификацию пользователя при загрузке приложения
  useEffect(() => {
    const userToken = localStorage.getItem('userToken');
    setIsAuthenticated(!!userToken);
    setLoading(false);
  }, []);

  // Компонент для защищенных маршрутов
  const ProtectedRoute = ({ children }) => {
    if (loading) return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Загрузка приложения</div>
        <div className="loading-subtext">Пожалуйста, подождите...</div>
      </div>
    );
    if (!isAuthenticated) return <Navigate to="/auth" />;
    return children;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/album/:albumId" element={<PublicAlbum />} />
          <Route path="/404" element={<NotFound />} />
          
          {/* Защищенные маршруты */}
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } />
          <Route path="/create-album" element={
            <ProtectedRoute>
              <CreateAlbumForm />
            </ProtectedRoute>
          } />
          <Route path="/admin/:albumId" element={
            <ProtectedRoute>
              <AdminAlbum />
            </ProtectedRoute>
          } />
          
          {/* Перенаправление на страницу авторизации при запуске */}
          <Route path="*" element={loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <div className="loading-text">Загрузка приложения</div>
              <div className="loading-subtext">Пожалуйста, подождите...</div>
            </div>
          ) : <Navigate to={isAuthenticated ? "/" : "/auth"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
