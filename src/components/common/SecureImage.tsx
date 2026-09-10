import { useState, useEffect } from 'react';
import type { ImgHTMLAttributes } from 'react';
import { apiClient } from '../../api/apiClient';
import { isInternalApiUrl, toApiRequestUrl } from '../../utils/url';

const DEFAULT_FALLBACK =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
      <rect fill="#e2e8f0" width="100%" height="100%"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="20">Немає обкладинки</text>
    </svg>`
  );

interface SecureImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  fallback?: string;
}

export const SecureImage = ({
  src,
  fallback = DEFAULT_FALLBACK,
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

      if (src.startsWith('data:image/')) {
        if (isMounted) {
          setImgSrc(src);
          setIsLoading(false);
        }
        return;
      }

      if (!isInternalApiUrl(src)) {
        if (isMounted) {
          setImgSrc(fallback);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const response = await apiClient.get(toApiRequestUrl(src), {
          responseType: 'blob',
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
        ...style,
      }}
      {...props}
    />
  );
};
