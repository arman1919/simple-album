import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PublicAlbum = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const checkAlbumExists = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/albums/${albumId}`);
        if (!response.data.exists) {
          navigate('/404');
          return;
        }
      } catch (err) {
        console.error('Error checking album:', err);
        navigate('/404');
        return;
      }
    };

    const fetchImages = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/albums/${albumId}/images`);
        const fetchedImages = response.data.images || [];
        
        if (fetchedImages.length === 0) {
          setError('В этом альбоме пока нет фотографий.');
        } else {
          setImages(fetchedImages);
        }
      } catch (err) {
        console.error('Error fetching images:', err);
        setError('Не удалось загрузить изображения. Пожалуйста, попробуйте еще раз.');
      } finally {
        setLoading(false);
      }
    };

    checkAlbumExists();
    fetchImages();
  }, [albumId, navigate]);

  const goToNextImage = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-6">Загрузка альбома...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-6">Фотоальбом</h1>
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Вернуться на главную
        </button>
      </div>
    );
  }

  // Calculate which images to show (current and next)
  const currentImage = images[currentIndex];
  const nextImage = currentIndex + 1 < images.length ? images[currentIndex + 1] : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Фотоальбом</h1>
      
      <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
        {/* Current image */}
        <div className="w-full md:w-1/2">
          <div className="bg-gray-100 p-4 rounded-lg shadow-md">
            <img 
              src={`http://localhost:5000${currentImage.path}`} 
              alt="Current" 
              className="w-full h-auto max-h-[70vh] object-contain rounded"
            />
            <p className="text-center mt-2 text-gray-600">
              Фото {currentIndex + 1} из {images.length}
            </p>
          </div>
        </div>
        
        {/* Next image (if available) */}
        {nextImage && (
          <div className="w-full md:w-1/2">
            <div className="bg-gray-100 p-4 rounded-lg shadow-md">
              <img 
                src={`http://localhost:5000${nextImage.path}`} 
                alt="Next" 
                className="w-full h-auto max-h-[70vh] object-contain rounded"
              />
              <p className="text-center mt-2 text-gray-600">
                Фото {currentIndex + 2} из {images.length}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Navigation buttons */}
      <div className="flex justify-center mt-8 gap-4">
        <button 
          onClick={goToPrevImage}
          disabled={currentIndex === 0}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Назад
        </button>
        <button 
          onClick={goToNextImage}
          disabled={currentIndex >= images.length - 1}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Вперёд
        </button>
      </div>
    </div>
  );
};

export default PublicAlbum;
