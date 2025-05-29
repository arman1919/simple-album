import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <h2 className="text-2xl mb-6">Страница не найдена</h2>
      <p className="mb-8">Запрашиваемый альбом не существует или был удален.</p>
      <Link 
        to="/" 
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded inline-block"
      >
        Вернуться на главную
      </Link>
    </div>
  );
};

export default NotFound;
