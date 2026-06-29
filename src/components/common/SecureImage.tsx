import { useState, useEffect } from 'react';
import type { ImgHTMLAttributes } from 'react'; // Виправлено імпорт типів
import { apiClient } from '../../api/apiClient';

interface SecureImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  fallback?: string;
}

export const SecureImage = ({ 
  src, 
  fallback = 'https://placehold.co/600x400?text=Немає+обкладинки', 
  alt, 
  className, 
  style, 
  ...props 
}: SecureImageProps) => {
  const [imgSrc, setImgSrc] = useState<string>(fallback);
  const [isLoading, setIsLoading] = useState<boolean>(!!src);

  useEffect(() => {
    let objectUrl: string | null = null;
    let isMounted = true;

    const fetchImage = async () => {
      if (!src) {
        if (isMounted) {
          setImgSrc(fallback);
          setIsLoading(false);
        }
        return;
      }

      // Якщо це зовнішнє посилання або base64, одразу показуємо його
      if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
        if (isMounted) {
          setImgSrc(src);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const response = await apiClient.get(src, {
          responseType: 'blob', // Обов'язково отримуємо бінарник
        });

        objectUrl = URL.createObjectURL(response.data);

        if (isMounted) {
          setImgSrc(objectUrl);
        }
      } catch (error) {
        console.error('Помилка завантаження зображення:', error);
        if (isMounted) setImgSrc(fallback);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchImage();

    // Очищення пам'яті
    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src, fallback]);

  return (
    <img
      src={imgSrc}
      alt={alt || 'Зображення'}
      className={className}
      style={{ 
        opacity: isLoading ? 0.7 : 1, 
        transition: 'opacity 0.3s ease',
        ...style 
      }}
      {...props}
    />
  );
};