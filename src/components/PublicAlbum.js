import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import '../styles/AlbumStyles.css';

// Базовый URL сервера для загрузки изображений
const SERVER_BASE_URL = 'http://localhost:5000';

function PublicAlbum() {
    const { albumId } = useParams();
    const navigate = useNavigate();
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [albumTitle, setAlbumTitle] = useState('');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isOwner, setIsOwner] = useState(false);

    // Функция для переключения на предыдущее изображение
    const prevImage = useCallback(() => {
        if (images.length === 0) return;
        setCurrentImageIndex((prevIndex) => 
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
    }, [images.length]);
    
    // Функция для переключения на следующее изображение
    const nextImage = useCallback(() => {
        if (images.length === 0) return;
        setCurrentImageIndex((prevIndex) => 
            prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
    }, [images.length]);
    
    // Обработчик нажатия клавиш
    const handleKeyDown = useCallback((event) => {
        if (event.key === 'ArrowLeft') {
            prevImage();
        } else if (event.key === 'ArrowRight') {
            nextImage();
        }
    }, [prevImage, nextImage]);
    
    // Добавляем обработчик нажатия клавиш
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
    
    // Проверяем, является ли пользователь владельцем альбома
    useEffect(() => {
        const checkOwnership = async () => {
            try {
                const userToken = localStorage.getItem('userToken');
                if (!userToken) {
                    setIsOwner(false);
                    return;
                }

                // Проверяем, есть ли у пользователя токен удаления для этого альбома
                const deleteToken = localStorage.getItem(`album_token_${albumId}`);
                if (deleteToken) {
                    setIsOwner(true);
                    return;
                }

                // Если нет токена удаления, проверяем через API
                try {
                    const response = await api.get(`/api/albums/${albumId}/check-ownership`, {
                        headers: {
                            'Authorization': `Bearer ${userToken}`
                        }
                    });
                    setIsOwner(response.data.isOwner);
                } catch (err) {
                    // Если ошибка при проверке, считаем что пользователь не владелец
                    setIsOwner(false);
                }
            } catch (err) {
                setIsOwner(false);
            }
        };

        if (albumId) {
            checkOwnership();
        }
    }, [albumId]);

    useEffect(() => {
        const fetchAlbumImages = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/api/albums/${albumId}/public`); 
                setImages(response.data.images || []); // Предполагается, что ответ содержит { images: ['url1', 'url2', ...] }
                
                // Если в ответе есть название альбома, устанавливаем его
                if (response.data.albumTitle) {
                    setAlbumTitle(response.data.albumTitle);
                }
                
                setError(null);
            } catch (err) {
                console.error("Error fetching album images:", err);
                setError('Не удалось загрузить альбом. Пожалуйста, попробуйте позже.');
                setImages([]);
            } finally {
                setLoading(false);
            }
        };

        if (albumId) {
            fetchAlbumImages();
        }
    }, [albumId]);

    if (loading) {
        return (
            <div className="album-container">
                <div className="loading-spinner"></div>
                <p className="loading-text">Загрузка альбома...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="album-container">
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()} className="retry-button">
                        Попробовать снова
                    </button>
                </div>
            </div>
        );
    }

    if (!images || images.length === 0) {
        return (
            <div className="album-container">
                <h2>{albumTitle}</h2>
                <div className="empty-album-message">
                    <p>В этом альбоме пока нет фотографий.</p>
                </div>
            </div>
        );
    }

    // Если есть изображения, получаем URL текущего изображения
    const getCurrentImageUrl = () => {
        if (images.length === 0 || currentImageIndex >= images.length) return null;
        
        const image = images[currentImageIndex];
        return (image.url || image).startsWith('http') 
            ? (image.url || image) 
            : `${SERVER_BASE_URL}${image.url || image}`;
    };
    
    // Переход к редактированию альбома
    const handleEditAlbum = () => {
        navigate(`/admin/${albumId}`);
    };
    
    return (
        <div className="album-container">
            <div className="album-header">
                <h2>{albumTitle}</h2>
                {isOwner && (
                    <button onClick={handleEditAlbum} className="edit-button">
                        Редактировать
                    </button>
                )}
            </div>
            
            {images.length > 0 && (
                <div className="slideshow-container">
                    <div className="current-image-container">
                        <img 
                            src={getCurrentImageUrl()} 
                            alt={`Фото ${currentImageIndex + 1}`} 
                            className="current-image"
                        />
                        <div className="image-number">{currentImageIndex + 1} / {images.length}</div>
                    </div>
                </div>
            )}
            
            {images.length === 0 && !loading && !error && (
                <div className="empty-album-message">
                    <p>В этом альбоме пока нет фотографий.</p>
                </div>
            )}
        </div>
    );
}

export default PublicAlbum;

